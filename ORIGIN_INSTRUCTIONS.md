# How to Generate the Origin Pro File

Since I cannot run the Origin Pro software directly in this environment, I have created a Python script that you can run on your local machine to automatically generate the `.opju` file with the graph and analysis.

## Prerequisites

1.  **Origin Pro Software**: You must have Origin Pro (2021 or later recommended) installed on your computer.
2.  **Python**: You need Python installed.
3.  **originpro package**: You need to install the `originpro` Python package.

## Instructions

1.  **Install the package**:
    Open your terminal or command prompt and run:
    ```bash
    pip install originpro
    ```

2.  **Run the script**:
    Ensure the file `Calibration_Data_For_Origin.csv` is in the same folder as the script.
    Run the script:
    ```bash
    python create_origin_project.py
    ```

3.  **Result**:
    The script will launch Origin (or connect to it), import the data, create the calibration graph with error bars, perform a linear fit, and save the result as **`P204_Calibration_Automated.opju`**.

## Alternative: Manual Import

If you prefer to do it manually using the CSV file I generated:

1.  Open **Origin Pro**.
2.  Go to **File > Import > Single ASCII...**
3.  Select **`Calibration_Data_For_Origin.csv`**.
4.  Set the column designations:
    *   `Observed_Wavelength_nm`: **X**
    *   `True_Wavelength_nm`: **Disregard** (or Y)
    *   `Delta_Lambda_nm`: **Y**
    *   `Uncertainty_nm`: **yEr** (Error Bar)
5.  Select the `Delta_Lambda_nm` column and click the **Scatter** plot button.
6.  Go to **Analysis > Fitting > Linear Fit** to add the trendline.
