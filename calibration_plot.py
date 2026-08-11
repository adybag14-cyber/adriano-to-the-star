import matplotlib.pyplot as plt
import numpy as np

def generate_perfect_calibration():
    # --- DATA (Approximated from your plot/Excel) ---
    # Note: I've corrected the sign to be POSITIVE (True - Obs)
    # This assumes Obs < True (e.g. Obs=667, True=670)
    lambda_obs = np.array([438.18, 471.04, 487.83, 501.61, 587.22, 667.64])
    delta_lambda = np.array([2.12, 2.16, 2.17, 2.19, 2.28, 2.36]) 
    
    # Error estimates
    y_err = [0.1] * len(lambda_obs)

    # --- FITTING ---
    # 1st Order (Linear) Fit to match your line
    coeffs = np.polyfit(lambda_obs, delta_lambda, 1)
    poly_fit = np.poly1d(coeffs)
    
    x_range = np.linspace(420, 680, 100)
    y_fit = poly_fit(x_range)
    
    # Residuals (Data - Fit)
    residuals = delta_lambda - poly_fit(lambda_obs)

    # --- PLOTTING ---
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(8, 7), sharex=True, 
                                   gridspec_kw={'height_ratios': [3, 1], 'hspace': 0.05})

    # TOP PANEL: Calibration Curve
    ax1.errorbar(lambda_obs, delta_lambda, yerr=y_err, fmt='ks', capsize=3, 
                 label='Experimental Data', zorder=5)
    ax1.plot(x_range, y_fit, 'r-', label='Linear Fit', linewidth=1.5)

    # Annotate Equation
    equation = f"$\Delta\lambda = {coeffs[0]:.4f} \lambda_{{obs}} + {coeffs[1]:.2f}$"
    ax1.text(0.05, 0.9, equation, transform=ax1.transAxes, fontsize=12,
             bbox=dict(facecolor='white', edgecolor='gray', alpha=0.9))

    # Formatting Top
    ax1.set_ylabel("Wavelength Correction $\Delta\lambda$ / nm", fontsize=12)
    ax1.set_ylim(2.0, 2.5) # Zoomed in Y
    ax1.grid(True, linestyle='--', alpha=0.5)
    ax1.legend(loc='lower right')
    ax1.set_title("Spectrometer Calibration Curve with Residuals", fontsize=14, pad=10)

    # BOTTOM PANEL: Residuals
    ax2.axhline(0, color='black', linestyle='-', linewidth=1)
    ax2.plot(lambda_obs, residuals, 'ro', markersize=6)
    ax2.vlines(lambda_obs, 0, residuals, colors='red', linewidth=1)
    
    # Formatting Bottom
    ax2.set_ylabel("Resid. / nm", fontsize=10)
    ax2.set_xlabel("Observed Wavelength $\lambda_{obs}$ / nm", fontsize=12)
    ax2.set_ylim(-0.05, 0.05)
    ax2.grid(True, linestyle=':', alpha=0.5)
    
    # Zoom X-axis to remove empty space
    ax2.set_xlim(420, 680)

    plt.tight_layout()
    plt.savefig('P204_Calibration_Exceptional_Fixed.png', dpi=300)
    print("Plot saved to P204_Calibration_Exceptional_Fixed.png")

if __name__ == "__main__":
    generate_perfect_calibration()
