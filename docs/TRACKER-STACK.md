# Tracker Full Stack Guide

This document walks through the Android app, Cloud SQL + Cloud Run API, and the web console wiring so you can track your phone securely inside Google Cloud.

---

## 1. Android “Find Hub” App (Kotlin)

1. **Create a new project** in Android Studio (Empty Activity, min SDK 26).
2. **Add permissions** in `AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
   <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
   <uses-permission android:name="android.permission.INTERNET" />
   ```
3. **Gradle dependencies** (`app/build.gradle`):
   ```gradle
   implementation "com.google.android.gms:play-services-location:21.3.0"
   implementation "androidx.work:work-runtime-ktx:2.9.0"
   implementation "com.squareup.okhttp3:okhttp:4.12.0"
   implementation "com.squareup.moshi:moshi-kotlin:1.15.1"
   ```
4. **WorkManager job** (`TrackerWorker`) collects location/battery/connection info and `POST`s to the Cloud Run endpoint every 15 minutes (only when the device has connectivity). Use `FusedLocationProviderClient` + `WorkManager`.
5. **API call**:
   ```kotlin
   object TrackerApi {
       private const val BASE_URL = "https://tracker-api-664033451690.us-east1.run.app"
       private const val API_KEY = "SharedTrackerKey123"
       private val client = OkHttpClient()

       fun sendUpdate(status: DeviceStatus) {
           val payload = moshi.adapter(DeviceStatus::class.java).toJson(status)
           val request = Request.Builder()
               .url("$BASE_URL/tracker/update")
               .post(payload.toRequestBody("application/json".toMediaType()))
               .addHeader("Authorization", "Bearer $API_KEY")
               .build()
           client.newCall(request).execute().use { if (!it.isSuccessful) throw IOException("Unexpected $it") }
       }
   }
   ```
6. **Permissions**: Show the native dialogs for Foreground + Background location before scheduling the worker.

---

## 2. Cloud SQL + Cloud Run API

### 2.1 Provision Cloud SQL (PostgreSQL)
```bash
gcloud services enable sqladmin.googleapis.com

gcloud sql instances create tracker-db \
  --database-version=POSTGRES_15 \
  --cpu=1 --memory=4GB \
  --region=us-east1 \
  --root-password=STRONG_PASSWORD

gcloud sql databases create tracker --instance=tracker-db
gcloud sql users create tracker_user --instance=tracker-db --password=STRONG_DB_PASS
```

Run the schema from `tracker-api/schema.sql`:
```bash
gcloud sql connect tracker-db --user=postgres
# once in the prompt:
\c tracker
\i schema.sql
```

### 2.2 Deploy the Tracker API (Cloud Run)
```bash
cd tracker-api
npm install
gcloud builds submit --tag us-east1-docker.pkg.dev/gen-lang-client-0741619489/site-prod-us-east1/tracker-api:v1

gcloud run deploy tracker-api \
  --image us-east1-docker.pkg.dev/gen-lang-client-0741619489/site-prod-us-east1/tracker-api:v1 \
  --region us-east1 \
  --allow-unauthenticated \
  --set-env-vars DB_INSTANCE=gen-lang-client-0741619489:us-east1:tracker-db,DB_NAME=tracker,DB_USER=tracker_user,DB_PASS=STRONG_DB_PASS,TRACKER_API_KEY=SharedTrackerKey123 \
  --add-cloudsql-instances gen-lang-client-0741619489:us-east1:tracker-db
```

### 2.3 Connect the web console
In `tracker.html`, configure the API block (before the IIFE):
```html
<script>
  window.TRACKER_API_CONFIG = {
    enabled: true,
    baseUrl: 'https://tracker-api-664033451690.us-east1.run.app',
    apiKey: 'SharedTrackerKey123',
    deviceId: 'primary-phone'
  };
</script>
```

After login, the page now pulls real data and pushes updates to Cloud SQL.

---

## 3. GitLab Runner & Pipeline Notes
- Git Bash + Git LFS installed on the Windows runner (`winget install Git.Git`, `git lfs install`).
- `config.toml` updated to `shell = "bash"` so the `pages` job can run Linux-style commands.
- Restart the runner service after editing `config.toml`:
  ```powershell
  cd C:\GitLab-Runner
  .\gitlab-runner.exe stop
  .\gitlab-runner.exe start
  ```

---

## 4. Android → Cloud Flow Summary
1. Phone app gathers location (Find Hub integration) and calls `POST /tracker/update`.
2. Cloud Run validates the API key and writes to Cloud SQL.
3. `tracker.html` fetches `GET /tracker/status` once unlocked.
4. Manual overrides in the web UI also `POST` to `/tracker/update`, keeping Cloud SQL authoritative.

You now have an end-to-end stack that covers device telemetry, secure storage, and a web console for review. Add alerts (Cloud Scheduler + Pub/Sub) or map overlays whenever you’re ready.

