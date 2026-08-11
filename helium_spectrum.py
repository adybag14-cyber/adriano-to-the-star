import matplotlib.pyplot as plt

def draw_helium_spectrum():
    # Setup the plot
    fig, ax = plt.subplots(figsize=(10, 8))
    
    # Define Energy Levels (approximate wavenumbers cm^-1 relative to ionization)
    # Using data from Table 1 in the script, converted roughly for visual scaling
    # Ground state 1s is at -198305, but we cut the y-axis to show excited states clearly
    
    # Dictionary structure: 'State': [L_value, Energy_Level]
    # L values: S=0, P=1, D=2
    
    singlets = {
        '1S': [0, -198305], 
        '2S': [0, -32033], '2P': [1, -27176],
        '3S': [0, -13446], '3P': [1, -12101], '3D': [2, -12206],
        '4S': [0, -7370],  '4P': [1, -6818],  '4D': [2, -6864],
        '5S': [0, -4647],  '5P': [1, -4368],  '5D': [2, -4393]
    }

    triplets = {
        '2S': [4, -38455], '2P': [5, -29224],
        '3S': [4, -15074], '3P': [5, -12746], '3D': [6, -12209],
        '4S': [4, -8013],  '4P': [5, -7094],  '4D': [6, -6866],
        '5S': [4, -4964],  '5P': [5, -4510],  '5D': [6, -4394]
    }

    # Draw Levels
    def plot_levels(states, color, label_prefix):
        for name, (l, e) in states.items():
            # Draw horizontal line for energy level
            ax.hlines(e, l-0.3, l+0.3, colors=color, linewidth=2)
            # Label the state (e.g., 2S)
            ax.text(l, e+1500, f"{name}", ha='center', va='bottom', fontsize=9, fontweight='bold')

    plot_levels(singlets, 'blue', '1')
    plot_levels(triplets, 'red', '3')

    # Draw Transitions (Arrows)
    # Selection Rules: Delta S = 0 (Stay in dictionary), Delta L = +/- 1
    
    transitions = [
        # Singlets (Left Side)
        # Upper -> Lower
        (singlets['2P'], singlets['1S']), # UV Resonance
        (singlets['3P'], singlets['1S']), 
        (singlets['3S'], singlets['2P']), # Visible Red
        (singlets['3D'], singlets['2P']), # Visible Yellow
        (singlets['4S'], singlets['2P']),
        (singlets['4P'], singlets['3S']),
        (singlets['4D'], singlets['2P']),
        
        # Triplets (Right Side)
        # Shift L coordinates for Triplets: S=4, P=5, D=6
        (triplets['2P'], triplets['2S']), # IR
        (triplets['3S'], triplets['2P']), 
        (triplets['3P'], triplets['2S']), 
        (triplets['3D'], triplets['2P']), 
        (triplets['4S'], triplets['2P']),
        (triplets['4P'], triplets['3S']),
        (triplets['4D'], triplets['2P']),
    ]

    for (start, end) in transitions:
        # Draw arrow
        ax.annotate("",
                    xy=(end[0], end[1]), xycoords='data',
                    xytext=(start[0], start[1]), textcoords='data',
                    arrowprops=dict(arrowstyle="->", color='black', lw=1.5, shrinkA=0, shrinkB=0))

    # Formatting the Plot
    ax.set_title("Helium Energy Level Diagram with Allowed Transitions\n(Post-Lab Question 3)", fontsize=14)
    ax.set_ylabel("Energy / Wavenumber ($cm^{-1}$)", fontsize=12)
    
    # Set X-axis labels
    ax.set_xlim(-1, 7)
    ax.set_xticks([0, 1, 2, 4, 5, 6])
    ax.set_xticklabels(['S', 'P', 'D', 'S', 'P', 'D'])
    
    # Add headings for Singlet/Triplet
    ax.text(1, -1000, "Singlets (Parahelium)", ha='center', fontsize=12, fontweight='bold')
    ax.text(5, -1000, "Triplets (Orthohelium)", ha='center', fontsize=12, fontweight='bold')

    # Handle the huge scale difference for 1S ground state
    # We create a "break" in the y-axis visually by limiting the view
    # Ground state is at -198,000, excited states start at -40,000
    # To make it readable, we focus on the excited states but keep the arrow pointing down to 1S
    ax.set_ylim(-42000, 0)
    
    # Add annotation for the deep 1S state
    ax.text(0, -41000, "To 1S Ground State\n(-198,305 $cm^{-1}$)", ha='center', va='bottom', fontsize=8, style='italic')

    # Grid and Layout
    ax.grid(True, linestyle='--', alpha=0.3)
    plt.tight_layout()
    
    # Save or Show
    plt.savefig('helium_transitions.png', dpi=300)
    print("Plot saved to helium_transitions.png")

if __name__ == "__main__":
    draw_helium_spectrum()
