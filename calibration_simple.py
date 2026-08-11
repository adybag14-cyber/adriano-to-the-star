import matplotlib.pyplot as plt
import numpy as np
import csv

def generate_calibration_simple_and_export():
    # --- DATA FROM IMAGE ---
    lambda_obs = np.array([443.6, 470.1, 482.1, 510.9, 559.3, 589.1, 646.2])
    lambda_true = np.array([441.5, 467.8, 480.0, 508.6, 557.0, 587.0, 643.8])
    
    # Calculate Delta Lambda (True - Obs)
    delta_lambda = lambda_true - lambda_obs
    
    # Uncertainty
    y_err = [0.5] * len(lambda_obs)

    # --- FITTING (Linear) ---
    coeffs = np.polyfit(lambda_obs, delta_lambda, 1)
    poly_fit = np.poly1d(coeffs)
    
    x_range = np.linspace(420, 680, 100)
    y_fit = poly_fit(x_range)

    # --- PLOTTING (No Residuals) ---
    fig, ax = plt.subplots(figsize=(8, 6))

    ax.errorbar(lambda_obs, delta_lambda, yerr=y_err, fmt='ks', capsize=4, 
                 label='Experimental Data', zorder=5)
    ax.plot(x_range, y_fit, 'r-', label='Linear Fit', linewidth=1.5)

    # Equation Label
    equation = f"$\Delta\lambda = {coeffs[0]:.4f} \lambda_{{obs}} {coeffs[1]:+.2f}$"
    ax.text(0.05, 0.1, equation, transform=ax.transAxes, fontsize=12,
             bbox=dict(facecolor='white', edgecolor='gray', alpha=0.9))

    ax.set_ylabel("Wavelength Correction $\Delta\lambda$ / nm", fontsize=12)
    ax.set_xlabel("Observed Wavelength $\lambda_{obs}$ / nm", fontsize=12)
    ax.set_title("Spectrometer Calibration Curve", fontsize=14, pad=10)
    ax.grid(True, linestyle='--', alpha=0.5)
    ax.legend(loc='upper right')
    
    # Adjust Y-limits
    ax.set_ylim(-3.0, -1.5)
    ax.set_xlim(420, 680)

    plt.tight_layout()
    plt.savefig('P204_Calibration_Simple.png', dpi=300)
    print("Plot saved to P204_Calibration_Simple.png")

    # --- EXPORT FOR ORIGIN PRO ---
    csv_filename = 'Calibration_Data_For_Origin.csv'
    
    # Prepare data rows
    rows = zip(lambda_obs, lambda_true, delta_lambda, y_err)
    
    with open(csv_filename, 'w', newline='') as f:
        writer = csv.writer(f)
        # Write Header
        writer.writerow(['Observed_Wavelength_nm', 'True_Wavelength_nm', 'Delta_Lambda_nm', 'Uncertainty_nm'])
        # Write Data
        writer.writerows(rows)
        
    print(f"Data exported to {csv_filename}")

if __name__ == "__main__":
    generate_calibration_simple_and_export()
