import matplotlib.pyplot as plt

def generate_helium_grotrian_final_submission():
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
            ax.hlines(e, l-0.35, l+0.35, colors=base_color, linewidth=3)
            ax.text(l, e + 600, term, ha='center', va='bottom', 
                    fontsize=12, fontweight='bold', color='black')

    def draw_spectral_arrow(start, end, system, color, label=None, offset_start=0, offset_end=0):
        x_start, y_start = system[start]
        
        if end == '1S':
            x_end, y_end = (x_start, -44000)
            ls = '--'
        else:
            x_end, y_end = system[end]
            ls = '-'

        x_s = x_start + offset_start
        x_e = x_end + offset_end

        ax.annotate("",
                    xy=(x_e, y_end), xycoords='data',
                    xytext=(x_s, y_start), textcoords='data',
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=2, ls=ls, shrinkA=0, shrinkB=4))
        
        if label:
            mid_x = (x_s + x_e) / 2
            mid_y = (y_start + y_end) / 2
            ax.text(mid_x, mid_y, label, fontsize=9, 
                    color=color, fontweight='bold', ha='center', va='center',
                    bbox=dict(facecolor='white', edgecolor='none', alpha=0.9, pad=1))

    # --- PLOTTING LEVELS ---
    plot_levels(singlets, '#004488') 
    plot_levels(triplets, '#CC0000') 

    # --- PLOTTING TRANSITIONS (12 Allowed Transitions) ---
    
    # === SINGLETS (Left) ===
    # 1. UV Resonance
    draw_spectral_arrow('2P', '1S', singlets, 'purple', "UV (58 nm)", offset_start=-0.1)
    
    # 2. Green Line (3P -> 2S)
    draw_spectral_arrow('3P', '2S', singlets, 'green', "502 nm", offset_start=-0.15, offset_end=-0.1)
    
    # 3. Red Line (3D -> 2P)
    draw_spectral_arrow('3D', '2P', singlets, '#D2222D', "668 nm", offset_start=0.1, offset_end=0.25)
    
    # 4. Blue-Green (4D -> 2P)
    draw_spectral_arrow('4D', '2P', singlets, '#008B8B', "492 nm", offset_start=0.1, offset_end=0.15)
    
    # 5. Violet (5D -> 2P)
    draw_spectral_arrow('5D', '2P', singlets, '#8A2BE2', "438 nm", offset_start=0.1, offset_end=0.05)

    # 6. Deep Red (3S -> 2P)
    draw_spectral_arrow('3S', '2P', singlets, '#8B0000', "728 nm", offset_start=0.1, offset_end=-0.25)

    
    # === TRIPLETS (Right) ===
    # 7. IR Metastable (2P -> 2S)
    draw_spectral_arrow('2P', '2S', triplets, 'black', "IR 1083 nm", offset_start=-0.2, offset_end=0.1)
    
    # 8. Red Line (3S -> 2P)
    draw_spectral_arrow('3S', '2P', triplets, 'red', "707 nm", offset_start=0.1, offset_end=-0.25)
    
    # 9. Yellow D3 Line (3D -> 2P)
    draw_spectral_arrow('3D', '2P', triplets, '#FFD700', "588 nm", offset_start=-0.1, offset_end=0.25)
    
    # 10. Blue Line (4S -> 2P)
    draw_spectral_arrow('4S', '2P', triplets, 'blue', "471 nm", offset_start=0.1, offset_end=-0.15)
    
    # 11. Blue Line (4D -> 2P)
    draw_spectral_arrow('4D', '2P', triplets, 'blue', "447 nm", offset_start=-0.1, offset_end=0.15)

    # 12. Violet Line (5D -> 2P) - NEW! Added to satisfy "At Least 12"
    draw_spectral_arrow('5D', '2P', triplets, '#9400D3', "403 nm", offset_start=-0.1, offset_end=0.05)

    # --- FORMATTING ---
    
    ax.axhline(0, color='gray', linestyle='--', linewidth=1)
    ax.text(3.5, 600, "Ionization Limit ($n = \infty$)", ha='center', style='italic')

    ax.text(0, -44500, "$\downarrow$\nTo Ground State $1^1S$\n$(-198,305 \ cm^{-1})$", 
            ha='center', va='top', fontsize=10, 
            bbox=dict(boxstyle='round', facecolor='#f0f0f0', edgecolor='black'))

    ax.set_ylabel("Energy / Wavenumber ($cm^{-1}$)", fontsize=14)
    ax.set_xlabel("Orbital Angular Momentum ($L$)", fontsize=14)
    
    ax.set_xticks([0, 1, 2, 4, 5, 6])
    ax.set_xticklabels(['S', 'P', 'D', 'S', 'P', 'D'], fontsize=12, fontweight='bold')
    ax.set_xlim(-1, 7)
    ax.set_ylim(-47000, 3000)

    ax.text(1, 3000, "SINGLETS (Parahelium)\n$(\Delta S = 0)$", ha='center', fontsize=14, fontweight='bold', color='#004488')
    ax.text(5, 3000, "TRIPLETS (Orthohelium)\n$(\Delta S = 0)$", ha='center', fontsize=14, fontweight='bold', color='#CC0000')
    
    ax.vlines(3, -42000, 0, linestyles='dotted', colors='gray')
    ax.text(3, -20000, "Intercombination Strictly Forbidden $(\Delta S \\neq 0)$", 
            ha='center', rotation=90, backgroundcolor='white', color='gray')

    # Add Note about Colors
    ax.text(3.5, -46000, "Note: Arrow colors correspond to\nobserved spectral line colors.", 
            ha='center', fontsize=10, style='italic', bbox=dict(facecolor='white', alpha=0.8))

    plt.tight_layout()
    plt.savefig('Helium_Grotrian_Final_Submission.png', dpi=300)
    print("Diagram saved to Helium_Grotrian_Final_Submission.png")

if __name__ == "__main__":
    generate_helium_grotrian_final_submission()
