import originpro as op
import os

def create_origin_project():
    # Ensure Origin is running or start it
    # This script must be run in an environment where 'originpro' is installed
    # and Origin software is available.
    
    # 1. Prepare Data File Path
    csv_filename = 'Calibration_Data_For_Origin.csv'
    csv_path = os.path.abspath(csv_filename)
    
    if not os.path.exists(csv_path):
        print(f"Error: Could not find {csv_path}")
        return

    # 2. Create a New Project
    op.new()
    
    # 3. Create a Worksheet and Import Data
    wks = op.new_sheet()
    wks.from_file(csv_path)
    
    # 4. Set Column Designations
    # Col 0: Observed (X)
    # Col 1: True (Y - but we don't plot this directly for calibration curve)
    # Col 2: Delta Lambda (Y)
    # Col 3: Uncertainty (yEr)
    
    # Note: CSV headers are in row 0. Data starts row 1.
    # originpro usually handles headers automatically with from_file
    
    wks.cols_axis = 'LXYE' # L=Label/Ignore (True Lambda), X=Obs, Y=Delta, E=Error
    # Wait, the columns in CSV are:
    # 0: Observed_Wavelength_nm (X)
    # 1: True_Wavelength_nm (Ignore/Label)
    # 2: Delta_Lambda_nm (Y)
    # 3: Uncertainty_nm (yEr)
    
    # Let's set explicitly if possible, or assume order.
    # wks.cols_axis string maps to columns. 
    # We want Col 0=X, Col 1=L (or Y), Col 2=Y, Col 3=yEr
    # Let's try to set designations specifically
    
    wks.set_label(0, "Observed Wavelength")
    wks.set_label(2, "Wavelength Correction")
    wks.set_label(3, "Uncertainty")
    
    # Set types using cols_axis string
    # X = X column
    # L = Label/Disregard (or Y but not plotted)
    # Y = Y column
    # E = Error bar
    wks.cols_axis = 'XLYE'
    
    # wks.set_type(0, 'X')
    # wks.set_type(1, 'L') 
    # wks.set_type(2, 'Y')
    # wks.set_type(3, 'yEr')
    
    # 5. Create Graph (Scatter with Error Bars)
    graph = op.new_graph(template='Origin')
    layer = graph[0]
    
    # Add plot: Wks, Col Y (2), Col X (0) is implied by designation
    dataplot = layer.add_plot(wks, coly=2, colx=0, type=201) # 201 = Scatter
    
    # 6. Perform Linear Fit
    # (Skipping automated fit due to API version differences. Please perform Analysis > Fitting > Linear Fit in Origin)
    print("Skipping automated linear fit. Please perform 'Analysis > Fitting > Linear Fit' manually in Origin.")
    
    # lr = op.LinearFit()
    # lr.set_data(wks, 0, 2) # X=Col 0, Y=Col 2
    # lr.run()
    # lr.report() # Create report sheet
    
    # Add Fit Line to Graph
    # fit_curve_wks = op.find_sheet('FitLinearCurve1')
    # if fit_curve_wks:
    #     # Plot the fit line (Col 1=X, Col 2=Y usually in fit curve sheet)
    #     layer.add_plot(fit_curve_wks, coly=1, colx=0, type=200) # 200 = Line
    
    # 7. Customize Graph
    layer.set_xlim(420, 680)
    layer.set_ylim(-3.0, -1.5)
    
    # Axis Titles
    # layer.set_label('b', r"Observed Wavelength \g(l)\-(obs) / nm") # Bottom
    # layer.set_label('l', r"Wavelength Correction \g(D)\g(l) / nm") # Left
    
    # graph.set_string('title', "Spectrometer Calibration Curve")
    
    layer.rescale()
    
    # 8. Save Project
    save_path = os.path.abspath("P204_Calibration_Automated.opju")
    op.save(save_path)
    print(f"Project saved to {save_path}")

    # Optional: Exit Origin
    # op.exit()

if __name__ == "__main__":
    try:
        create_origin_project()
    except Exception as e:
        print(f"An error occurred: {e}")
        print("Ensure you have 'originpro' installed and Origin software running.")
