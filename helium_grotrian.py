import matplotlib.pyplot as plt

def generate_helium_grotrian_final():
    # --- DATA SETUP ---
    # Energy levels (approx cm^-1 relative to Ionization Limit)
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

    fig, ax = plt.subplots(figsize=(14, 10))
    
    # --- PLOTTING FUNCTIONS ---
    
    def plot_levels(states, color):
        for term, (l, e) in states.items():
            if term == '1S': continue
            # Draw the horizontal energy level
            ax.hlines(e, l-0.35, l+0.35, colors=color, linewidth=3)
            # Label the level (e.g. 3D)
            ax.text(l, e + 600, term, ha='center', va='bottom', 
                    fontsize=11, fontweight='bold', color=color)

    def draw_arrow(start_state, end_state, system, color='black', label=None, offset=0):
        """
        Draws transition arrow with optional offset to prevent overlap.
        """
        x_start, y_start = system[start_state]
        
        # Handle 1S special case
        if end_state == '1S':
            x_end, y_end = (x_start, -43000)
            style = "dashed"
            color = "purple"
        else:
            x_end, y_end = system[end_state]
            style = "solid"

        # Apply small X-offset for multiple arrows hitting same level
        x_start += offset
        x_end += offset

        ax.annotate("",
                    xy=(x_end, y_end), xycoords='data',
                    xytext=(x_start, y_start), textcoords='data',
                    arrowprops=dict(arrowstyle="-|>", color=color, lw=1.5, ls=style, shrinkA=0, shrinkB=5))
        
        # Add Label (Wavelength/Color) if provided
        if label:
            mid_x = (x_start + x_end) / 2
            mid_y = (y_start + y_end) / 2
            ax.text(mid_x + 0.1, mid_y, label, fontsize=9, rotation=0, 
                    bbox=dict(facecolor='white', edgecolor='none', alpha=0.7, pad=0))

    # --- EXECUTE PLOT ---

    plot_levels(singlets, '#004488') # Dark Blue
    plot_levels(triplets, '#CC0000') # Dark Red

    # Singlet Transitions (Left)
    # The offsets (last number) help prevent arrows from overlapping at the arrowheads
    draw_arrow('2P', '1S', singlets, label="UV (58 nm)")
    draw_arrow('2P', '2S', singlets, offset=-0.1) 
    
    draw_arrow('3S', '2P', singlets, offset=-0.1) 
    draw_arrow('3D', '2P', singlets, label="Red\n667nm", offset=0.1) # Observed Line
    
    draw_arrow('4S', '2P', singlets, offset=-0.2)
    draw_arrow('4D', '2P', singlets, label="Blue\n492nm", offset=0.2) # Observed Line
    draw_arrow('5D', '2P', singlets, offset=0.25)
    
    draw_arrow('4P', '3S', singlets)

    # Triplet Transitions (Right)
    draw_arrow('2P', '2S', triplets, label="IR\n1083nm") # Famous metastable transition
    
    draw_arrow('3S', '2P', triplets, label="Red\n706nm", offset=-0.1) # Observed Line
    draw_arrow('3D', '2P', triplets, label="Yellow\n587nm", offset=0.1) # The famous D3 line
    
    draw_arrow('4S', '2P', triplets, label="Blue\n471nm", offset=-0.2) # Observed Line
    draw_arrow('4D', '2P', triplets, label="Blue\n447nm", offset=0.2) # Observed Line
    
    draw_arrow('3P', '2S', triplets)
    draw_arrow('4P', '3S', triplets)

    # --- DECORATION ---
    
    # Ionization Limit
    ax.axhline(0, color='gray', linestyle='--', linewidth=1)
    ax.text(3.5, 500, "Ionization Limit ($n = \infty$)", ha='center', style='italic')

    # Deep Ground State Indicator
    ax.text(0, -43500, "$\downarrow$\nTo Ground State $1^1S$\n$(-198,305 \ cm^{-1})$", 
            ha='center', va='top', fontsize=10, 
            bbox=dict(boxstyle='round', facecolor='#f0f0f0'))

    # Axis Setup
    ax.set_ylabel("Energy / Wavenumber ($cm^{-1}$)", fontsize=14)
    ax.set_xticks([0, 1, 2, 4, 5, 6])
    ax.set_xticklabels(['S', 'P', 'D', 'S', 'P', 'D'], fontsize=12, fontweight='bold')
    ax.set_xlim(-1, 7)
    ax.set_ylim(-46000, 3000)

    # Titles and Annotations
    ax.text(1, 2500, "SINGLETS (Parahelium)\n$(\Delta S = 0)$", ha='center', fontsize=14, fontweight='bold', color='#004488')
    ax.text(5, 2500, "TRIPLETS (Orthohelium)\n$(\Delta S = 0)$", ha='center', fontsize=14, fontweight='bold', color='#CC0000')
    
    # Selection Rule Divider
    ax.vlines(3, -40000, 0, linestyles='dotted', colors='gray')
    ax.text(3, -20000, "Intercombination Forbidden $(\Delta S \\neq 0)$", 
            ha='center', rotation=90, backgroundcolor='white', color='gray')

    plt.title("Figure 3: Helium Energy Level Diagram with Experimental Transitions", fontsize=16, pad=15)
    plt.tight_layout()
    
    # Save
    plt.savefig('Helium_Grotrian_Exceptional.png', dpi=300)
    print("Diagram saved to Helium_Grotrian_Exceptional.png")

if __name__ == "__main__":
    generate_helium_grotrian_final()
