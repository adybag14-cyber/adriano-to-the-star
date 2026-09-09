/* Screen-space adaptive cube-sphere. Small physical displacement and skirts
   retain a smooth horizon; detail is refined near the camera instead of fixing
   the whole planet to a 980-triangle polyhedron. */
export class AdaptiveTerrain {
    constructor(THREE, material) {
        this.THREE = THREE;
        this.material = material;
        this.group = new THREE.Group();
        this.created = 0;
        this.faces = [
            [
                [1, 0, 0],
                [0, 0, -1],
                [0, 1, 0],
            ],
            [
                [-1, 0, 0],
                [0, 0, 1],
                [0, 1, 0],
            ],
            [
                [0, 1, 0],
                [1, 0, 0],
                [0, 0, -1],
            ],
            [
                [0, -1, 0],
                [1, 0, 0],
                [0, 0, 1],
            ],
            [
                [0, 0, 1],
                [1, 0, 0],
                [0, 1, 0],
            ],
            [
                [0, 0, -1],
                [-1, 0, 0],
                [0, 1, 0],
            ],
        ];
        this.roots = this.faces.map((basis, face) => this.node(face, -1, -1, 2, 0));
    }
    direction(face, u, v) {
        const [n, a, b] = this.faces[face],
            T = this.THREE;
        return new T.Vector3(
            n[0] + a[0] * u + b[0] * v,
            n[1] + a[1] * u + b[1] * v,
            n[2] + a[2] * u + b[2] * v
        ).normalize();
    }
    node(face, u, v, size, level) {
        const T = this.THREE,
            segments = 24,
            positions = [],
            normals = [],
            indices = [];
        for (let y = 0; y <= segments; y++)
            for (let x = 0; x <= segments; x++) {
                const p = this.direction(
                    face,
                    u + (size * x) / segments,
                    v + (size * y) / segments
                );
                positions.push(p.x, p.y, p.z);
                normals.push(p.x, p.y, p.z);
            }
        for (let y = 0; y < segments; y++)
            for (let x = 0; x < segments; x++) {
                const a = y * (segments + 1) + x,
                    b = a + 1,
                    c = a + segments + 1,
                    d = c + 1;
                indices.push(a, b, c, b, d, c);
            }
        // Winding differs by face basis; make it outward explicitly.
        const p0 = new T.Vector3(...positions.slice(indices[0] * 3, indices[0] * 3 + 3));
        const p1 = new T.Vector3(...positions.slice(indices[1] * 3, indices[1] * 3 + 3));
        const p2 = new T.Vector3(...positions.slice(indices[2] * 3, indices[2] * 3 + 3));
        const reverse = p1.sub(p0).cross(p2.sub(p0)).dot(p0) < 0;
        if (reverse)
            for (let i = 0; i < indices.length; i += 3)
                [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
        const edges = [];
        for (let i = 0; i < segments; i++)
            edges.push(
                [i, i + 1],
                [segments * (segments + 1) + i, segments * (segments + 1) + i + 1],
                [i * (segments + 1), (i + 1) * (segments + 1)],
                [i * (segments + 1) + segments, (i + 1) * (segments + 1) + segments]
            );
        for (const [a, b] of edges) {
            const c = positions.length / 3;
            for (const n of [a, b]) {
                positions.push(
                    positions[n * 3] * 0.994,
                    positions[n * 3 + 1] * 0.994,
                    positions[n * 3 + 2] * 0.994
                );
                normals.push(normals[n * 3], normals[n * 3 + 1], normals[n * 3 + 2]);
            }
            indices.push(a, b, c, b, c + 1, c);
        }
        const geometry = new T.BufferGeometry();
        geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('normal', new T.Float32BufferAttribute(normals, 3));
        geometry.setIndex(indices);
        geometry.computeBoundingSphere();
        geometry.boundingSphere.radius += 0.02;
        const mesh = new T.Mesh(geometry, this.material);
        mesh.visible = false;
        this.group.add(mesh);
        this.created++;
        return {
            face,
            u,
            v,
            size,
            level,
            mesh,
            children: null,
            center: this.direction(face, u + size / 2, v + size / 2),
        };
    }
    disposeChildren(node) {
        if (!node.children) return;
        for (const c of node.children) {
            this.disposeChildren(c);
            this.group.remove(c.mesh);
            c.mesh.geometry.dispose();
            this.created--;
        }
        node.children = null;
    }
    update(camera, height) {
        this.group.updateMatrixWorld(true);
        const inverse = this.group.quaternion.clone().invert(),
            position = camera.position.clone().applyQuaternion(inverse);
        const view = position.clone().normalize(),
            scale = height / (2 * Math.tan((camera.fov * Math.PI) / 360));
        let budget = 12,
            leaves = 0,
            triangles = 0,
            maxLevel = 0,
            pendingRefinement = false;
        const visit = (node) => {
            const visible =
                node.center.dot(view) + node.size * 0.9 >
                1 / Math.max(position.length(), 1.004) - 0.05;
            if (!visible) {
                node.mesh.visible = false;
                this.disposeChildren(node);
                return;
            }
            const distance = Math.max(0.003, position.distanceTo(node.center));
            const projected = (node.size * scale) / distance;
            const split =
                projected > 250 && node.level < 11 && (this.created < 450 || node.children);
            if (split && !node.children && budget >= 4) {
                const s = node.size / 2;
                node.children = [
                    this.node(node.face, node.u, node.v, s, node.level + 1),
                    this.node(node.face, node.u + s, node.v, s, node.level + 1),
                    this.node(node.face, node.u, node.v + s, s, node.level + 1),
                    this.node(node.face, node.u + s, node.v + s, s, node.level + 1),
                ];
                budget -= 4;
            }
            if (split && !node.children && budget < 4) pendingRefinement = true;
            if (!split && node.children && projected < 155) this.disposeChildren(node);
            if (node.children) {
                node.mesh.visible = false;
                node.children.forEach(visit);
            } else {
                node.mesh.visible = true;
                leaves++;
                triangles += node.mesh.geometry.index.count / 3;
                maxLevel = Math.max(maxLevel, node.level);
            }
        };
        this.roots.forEach(visit);
        this.stats = {
            leaves,
            triangles,
            maxLevel,
            allocatedTiles: this.created,
            pendingRefinement,
        };
    }
    dispose() {
        for (const node of this.roots) {
            this.disposeChildren(node);
            node.mesh.geometry.dispose();
        }
        this.group.clear();
    }
}
