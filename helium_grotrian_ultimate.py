import matplotlib.pyplot as plt

def generate_helium_grotrian_ultimate():
    # --- DATA SETUP (Wavenumbers cm^-1) ---
    singlets = {
        '1S': (0, -198305), 
        '2S': (0, -32033), '2P': (1, -27176),
        '3S': (0, -13446), '3P': (1, -12101), '3D': (2, -12206),
        '4S': (0, -7370),  '4P': (1, -6818),  '4D': (2, -6864),
        '5S': (0, -4647),  '5P': (1, -4368),  '5D': (2, -4393)
    }

    triplets = {
        '2S': (4, -38455), '2P': (5, -29224),
        '3S': (4, -15074), '3P': (5, -12746), '3D': (6, -12209),
        '4S': (4, -8013),  '4P': (5, -7094),  '4D': (6, -6866),
        '5S': (4, -4964),  '5P': (5, -4510),  '5D': (6, -4394)
    }

    fig, ax = plt.subplots(figsize=(14, 11))
    
    # --- PLOTTING FUNCTIONS ---
    
    def plot_levels(states, base_color):
        for term, (l, e) in states.items():
            if term == '1S': continue
            # Draw level line
            ax.hlines(e, l-0.35, l+0.35, colors=base_color, linewidth=3)
            # Label the level (e.g., 3P)
            ax.text(l, e + 600, term, ha='center', va='bottom', 
                    fontsize=12, fontweight='bold', color='black')

    def draw_spectral_arrow(start, end, system, color, label=None, offset_start=0, offset_end=0):
        x_start, y_start = system[start]
        
        # Handle UV to ground case
        if end == '1S':
            x_end, y_end = (x_start, -44000)
            ls = '--'
        else:
            x_end, y_end = system[end]
            ls = '-'

        # Apply offsets
        x_s = x_start + offset_start
        x_e = x_end + offset_end

        # Draw Arrow
        ax.annotate("",
                    xy=(x_e, y_end), xycoords='data',
                    xytext=(x_s, y_start), textcoords='data',
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=2, ls=ls, shrinkA=0, shrinkB=4))
        
        # Draw Label with White Background (The Key Improvement)
        if label:
            mid_x = (x_s + x_e) / 2
            mid_y = (y_start + y_end) / 2
            
            # Smart positioning to avoid overlapping the line
            ax.text(mid_x, mid_y, label, fontsize=9, 
                    color=color, fontweight='bold', ha='center', va='center',
                    bbox=dict(facecolor='white', edgecolor='none', alpha=0.9, pad=1))

    # --- PLOTTING LEVELS ---
    plot_levels(singlets, '#004488') 
    plot_levels(triplets, '#CC0000') 

    # --- PLOTTING TRANSITIONS (12+ Total) ---
    
    # === SINGLETS (Left) ===
    # 1. UV Resonance (2P -> 1S)
    draw_spectral_arrow('2P', '1S', singlets, 'purple', "UV (58 nm)", offset_start=-0.1)
    
    # 2. Green Line (3P -> 2S)
    # Note: This is P -> S. In Singlets, 2S is (-32033), 3P is (-12101).
    draw_spectral_arrow('3P', '2S', singlets, 'green', "502 nm", offset_start=-0.15, offset_end=-0.1)
    
    # 3. Red Line (3D -> 2P)
    draw_spectral_arrow('3D', '2P', singlets, '#D2222D', "668 nm", offset_start=0.1, offset_end=0.25)
    
    # 4. Blue-Green (4D -> 2P)
    draw_spectral_arrow('4D', '2P', singlets, '#008B8B', "492 nm", offset_start=0.1, offset_end=0.15)
    
    # 5. Violet (5D -> 2P)
    draw_spectral_arrow('5D', '2P', singlets, '#8A2BE2', "438 nm", offset_start=0.1, offset_end=0.05)

    # 6. Deep Red (3S -> 2P)
    draw_spectral_arrow('3S', '2P', singlets, '#8B0000', "728 nm", offset_start=0.1, offset_end=-0.25)

    # 7. Green-Blue (4S -> 2P)
    draw_spectral_arrow('4S', '2P', singlets, '#2E8B57', "505 nm", offset_start=0.1, offset_end=-0.15)

    
    # === TRIPLETS (Right) ===
    # 8. IR Metastable (2P -> 2S)
    draw_spectral_arrow('2P', '2S', triplets, 'black', "IR 1083 nm", offset_start=-0.2, offset_end=0.1)
    
    # 9. Red Line (3S -> 2P)
    draw_spectral_arrow('3S', '2P', triplets, 'red', "707 nm", offset_start=0.1, offset_end=-0.25)
    
    # 10. Yellow D3 Line (3D -> 2P)
    draw_spectral_arrow('3D', '2P', triplets, '#FFD700', "588 nm", offset_start=-0.1, offset_end=0.25)
    
    # 11. Blue Line (4S -> 2P)
    draw_spectral_arrow('4S', '2P', triplets, 'blue', "471 nm", offset_start=0.1, offset_end=-0.15)
    
    # 12. Blue Line (4D -> 2P)
    draw_spectral_arrow('4D', '2P', triplets, 'blue', "447 nm", offset_start=-0.1, offset_end=0.15)

    # --- FORMATTING ---
    
    # Ionization Limit
    ax.axhline(0, color='gray', linestyle='--', linewidth=1)
    ax.text(3.5, 600, "Ionization Limit ($n = \infty$)", ha='center', style='italic')

    # Ground State Text
    ax.text(0, -44500, "$\downarrow$\nTo Ground State $1^1S$\n$(-198,305 \ cm^{-1})$", 
            ha='center', va='top', fontsize=10, 
            bbox=dict(boxstyle='round', facecolor='#f0f0f0', edgecolor='black'))

    # Axis Labels
    ax.set_ylabel("Energy / Wavenumber ($cm^{-1}$)", fontsize=14)
    ax.set_xlabel("Orbital Angular Momentum ($L$)", fontsize=14)
    
    # X-Ticks
    ax.set_xticks([0, 1, 2, 4, 5, 6])
    ax.set_xticklabels(['S', 'P', 'D', 'S', 'P', 'D'], fontsize=12, fontweight='bold')
    ax.set_xlim(-1, 7)
    ax.set_ylim(-47000, 3000)

    # Main Titles
    ax.text(1, 3000, "SINGLETS (Parahelium)\n$(\Delta S = 0)$", ha='center', fontsize=14, fontweight='bold', color='#004488')
    ax.text(5, 3000, "TRIPLETS (Orthohelium)\n$(\Delta S = 0)$", ha='center', fontsize=14, fontweight='bold', color='#CC0000')
    
    # Forbidden Zone Divider
    ax.vlines(3, -42000, 0, linestyles='dotted', colors='gray')
    ax.text(3, -20000, "Intercombination Strictly Forbidden $(\Delta S \\neq 0)$", 
            ha='center', rotation=90, backgroundcolor='white', color='gray')

    plt.tight_layout()
    
    # Save high res for report
    plt.savefig('Helium_Grotrian_Ultimate.png', dpi=300)
    print("Diagram saved to Helium_Grotrian_Ultimate.png")

if __name__ == "__main__":
    generate_helium_grotrian_ultimate()
