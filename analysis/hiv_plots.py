import os
import pandas as pd
import matplotlib.pyplot as plt

global_trend = pd.DataFrame({
    "year": [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
    "plhiv_millions": [36.7, 37.1, 37.5, 37.9, 38.0, 38.4, 38.8, 39.0, 39.0, 39.2]
})

region_dist = pd.DataFrame({
    "region": [
        "WHO African Region", "Asia & Pacific", "Latin America",
        "W/C Europe & N. America", "E. Europe & C. Asia",
        "Middle East & N. Africa", "Caribbean"
    ],
    "plhiv_millions": [26.3, 6.3, 2.2, 2.3, 1.7, 0.4, 0.3]
})

out_dir = os.path.join(os.getcwd(), "analysis", "plots")
os.makedirs(out_dir, exist_ok=True)

plt.figure(figsize=(8, 5))
plt.plot(global_trend["year"], global_trend["plhiv_millions"], marker="o")
plt.title("Global PLHIV Trend (Placeholder)")
plt.xlabel("Year")
plt.ylabel("PLHIV (millions)")
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(out_dir, "hiv_global_trend.png"))
plt.close()

plt.figure(figsize=(7, 7))
plt.pie(region_dist["plhiv_millions"], labels=region_dist["region"], autopct="%1.1f%%", startangle=140)
plt.title("PLHIV Distribution by Region (2024)")
plt.tight_layout()
plt.savefig(os.path.join(out_dir, "hiv_region_pie.png"))
plt.close()

try:
    import plotly.express as px
    import plotly.io as pio
    sa = pd.DataFrame({
        "country": ["South Africa", "Mozambique", "Zimbabwe", "Zambia", "Malawi", "Namibia", "Botswana", "Lesotho", "Eswatini"],
        "iso_alpha": ["ZAF", "MOZ", "ZWE", "ZMB", "MWI", "NAM", "BWA", "LSO", "SWZ"],
        "plhiv_millions": [7.8, 2.1, 1.3, 1.2, 1.1, 0.2, 0.3, 0.33, 0.22]
    })
    fig = px.choropleth(
        sa,
        locations="iso_alpha",
        color="plhiv_millions",
        hover_name="country",
        color_continuous_scale="Reds",
        title="Southern Africa PLHIV (Illustrative)"
    )
    fig.write_html(os.path.join(out_dir, "hiv_southern_africa_choropleth.html"))
    pio.write_image(fig, os.path.join(out_dir, "hiv_southern_africa_choropleth.png"), format="png")
except Exception as e:
    print("Map not generated (install plotly + kaleido for PNG):", e)

plt.figure(figsize=(12, 5))
regions = ["Africa (WHO Region)", "Rest of the World"]
plhiv_share = [26.3, 14.5]
colors = ["#E04F5F", "#A9A9A9"]
years = ["2010", "2024"]
plhiv_trends = [34.0, 40.8]
ax1 = plt.subplot(1, 2, 1)
ax1.pie(plhiv_share, labels=regions, autopct="%1.1f%%", startangle=90, colors=colors)
ax1.set_title("Global PLHIV Distribution (2024)")
ax2 = plt.subplot(1, 2, 2)
ax2.bar(years, plhiv_trends, color=["#4682B4", "#1E90FF"], width=0.5)
ax2.set_title("Increase in PLHIV (2010 vs 2024)")
ax2.set_ylabel("Millions")
ax2.set_ylim(0, 50)
for i, v in enumerate(plhiv_trends):
    ax2.text(i, v + 0.5, str(v) + "m", ha="center")
plt.tight_layout()
plt.savefig(os.path.join(out_dir, "hiv_user_figure1.png"))
plt.close()

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
plhiv_labels = ["Africa (Impact Market)", "Rest of World"]
plhiv_data = [26.0, 14.8]
colors_plhiv = ["#E04F5F", "#D3D3D3"]
revenue_labels = ["North America (Profit Market)", "Rest of World"]
revenue_data = [46, 54]
colors_revenue = ["#4682B4", "#D3D3D3"]
ax1.pie(plhiv_data, labels=plhiv_labels, autopct="%1.1f%%", startangle=90, colors=colors_plhiv, textprops={"fontsize": 11})
ax1.set_title("Distribution of PLHIV (2024)", fontsize=13)
ax2.pie(revenue_data, labels=revenue_labels, autopct="%1.1f%%", startangle=90, colors=colors_revenue, textprops={"fontsize": 11})
ax2.set_title("Global HIV Drug Market Revenue (2024)", fontsize=13)
plt.tight_layout()
plt.savefig(os.path.join(out_dir, "hiv_distribution_vs_revenue.png"))
plt.close()
