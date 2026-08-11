import matplotlib.pyplot as plt
import numpy as np

def generate_calibration_from_handwriting():
    # --- DATA FROM IMAGE ---
    # Observed values (Right column in your subtraction)
    lambda_obs = np.array([443.6, 470.1, 482.1, 510.9, 559.3, 589.1, 646.2])
    
    # True values (Left column in your subtraction)
    # Using standard Cd/Kr lines: 441.5, 467.8, 480.0, 508.6, 557.0, 587.0, 643.8
    lambda_true = np.array([441.5, 467.8, 480.0, 508.6, 557.0, 587.0, 643.8])
    
    # Calculate Delta Lambda (True - Obs)
    # This will result in negative values (-2.1 to -2.4) based on your notes
    delta_lambda = lambda_true - lambda_obs
    
    # Uncertainty
    y_err = [0.5] * len(lambda_obs)

    # --- FITTING (Linear) ---
    coeffs = np.polyfit(lambda_obs, delta_lambda, 1)
    poly_fit = np.poly1d(coeffs)
    
    x_range = np.linspace(420, 680, 100)
    y_fit = poly_fit(x_range)
    
    # Residuals
    residuals = delta_lambda - poly_fit(lambda_obs)

    # --- PLOTTING ---
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8, 8), sharex=True, 
                                   gridspec_kw={'height_ratios': [3, 1], 'hspace': 0.05})

    # TOP PANEL
    ax1.errorbar(lambda_obs, delta_lambda, yerr=y_err, fmt='ks', capsize=4, 
                 label='Experimental Data', zorder=5)
    ax1.plot(x_range, y_fit, 'r-', label='Linear Fit', linewidth=1.5)

    # Equation Label
    # Note: Coefficients will be small negative or positive depending on slope
    equation = f"$\Delta\lambda = {coeffs[0]:.4f} \lambda_{{obs}} {coeffs[1]:+.2f}$"
    ax1.text(0.05, 0.1, equation, transform=ax1.transAxes, fontsize=12,
             bbox=dict(facecolor='white', edgecolor='gray', alpha=0.9))

    ax1.set_ylabel("Wavelength Correction $\Delta\lambda$ / nm", fontsize=12)
    ax1.set_title("Spectrometer Calibration Curve with Residuals", fontsize=14, pad=10)
    ax1.grid(True, linestyle='--', alpha=0.5)
    ax1.legend(loc='upper right')
    
    # Adjust Y-limits for negative values
    ax1.set_ylim(-3.0, -1.5)

    # BOTTOM PANEL (Residuals)
    ax2.axhline(0, color='black', linestyle='-', linewidth=1)
    ax2.plot(lambda_obs, residuals, 'ro', markersize=6, markeredgecolor='black')
    ax2.vlines(lambda_obs, 0, residuals, colors='red', linewidth=1)
    
    ax2.set_ylabel("Resid. / nm", fontsize=10)
    ax2.set_xlabel("Observed Wavelength $\lambda_{obs}$ / nm", fontsize=12)
    ax2.set_ylim(-0.2, 0.2)
    ax2.grid(True, linestyle=':', alpha=0.5)
    ax2.set_xlim(420, 680)

    plt.tight_layout()
    plt.savefig('P204_Calibration_Handwritten_7Points.png', dpi=300)
    print("Plot saved to P204_Calibration_Handwritten_7Points.png")

if __name__ == "__main__":
    generate_calibration_from_handwriting()
