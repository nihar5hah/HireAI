# How to Record Your Demo with OBS Studio

Follow these steps to configure OBS Studio and record your AI Hiring Platform walkthrough.

## 1. Initial Setup
1.  **Open OBS Studio**.
2.  **Open your Browser**: Make sure your AI Hiring Platform is running at `http://localhost:3000` in your preferred browser (Chrome, Edge, etc.).

## 2. Set Up Your Scene & Sources
A "Scene" is like a canvas, and "Sources" are the things you want to show (browser, webcam, microphone).

1.  **Create a Scene**:
    *   In the **Scenes** box (bottom left), click the **+** icon.
    *   Name it `Demo Recording` and click OK.

2.  **Add Your Browser (Visuals)**:
    *   In the **Sources** box (next to Scenes), click the **+** icon.
    *   Select **Window Capture**.
    *   Name it `Browser` and click OK.
    *   In the "Window" dropdown, select your browser window (e.g., `[chrome.exe]: HireAI - Google Chrome`).
    *   *Tip:* Uncheck "Capture Cursor" if you don't want your mouse visible, but for a demo, it's usually better to keep it **checked** so viewers can follow what you click.
    *   Click OK.
    *   **Resize**: If the window doesn't fill the black canvas, right-click the `Browser` source > **Transform** > **Fit to screen** (or press `Ctrl + F`).

3.  **Add Your Microphone (Audio)**:
    *   *Only do this if you plan to speak during the recording.*
    *   In the **Sources** box, click the **+** icon.
    *   Select **Audio Input Capture**.
    *   Name it `Microphone`.
    *   Select your microphone device from the list.
    *   Click OK.
    *   *Check:* Speak into your mic. You should see the green bar move in the "Audio Mixer" section.

## 3. Configuration for Best Quality
1.  Click **Settings** (bottom right).
2.  Go to **Output**:
    *   Set **Recording Quality** to **High Quality, Medium File Size**.
    *   Set **Recording Format** to **mkv** or **mp4** (MP4 is easier to share/edit).
    *   Set **Encoder** to **Hardware (NVENC)** if available (better performance), otherwise use **Software (x264)**.
3.  Go to **Video**:
    *   **Base (Canvas) Resolution**: 1920x1080 (Standard HD).
    *   **Output (Scaled) Resolution**: 1920x1080.
    *   **FPS**: 60 (for smooth animation) or 30 (standard).
4.  Click **Apply** and **OK**.

## 4. Recording Checklist
Before you hit record:
- [ ] **Script**: Have your `DEMO_SCRIPT.md` open on a second monitor or printed out.
- [ ] **Clean Browser**: Close unnecessary tabs. Hide your bookmarks bar (Ctrl+Shift+B) for a cleaner look.
- [ ] **App State**: Ensure your database is clean or ready. You might want to refresh the page to start from the login/landing screen.

## 5. Recording
1.  Press **Start Recording** in OBS (bottom right).
2.  Wait 2-3 seconds of silence (for editing breathing room).
3.  **Follow the Script**:
    *   Read your "Intro" lines.
    *   Perform the actions for the "Recruiter Flow".
    *   Perform the actions for the "Candidate Flow".
    *   Perform the actions for the "Results Flow".
    *   Read your "Conclusion".
4.  Wait 2-3 seconds of silence.
5.  Press **Stop Recording**.

## 6. Locate Your File
1.  In OBS, go to **File** (top left menu) -> **Show Recordings**.
2.  Your video file should be there! Play it back to check the sound levels and video clarity.
