package com.beejay.boxtile;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Shows the hosted game full screen and keeps the TV awake. */
public class MainActivity extends Activity {
    private static final String URL = "https://beejay06.github.io/Boxtile/";
    private WebView web;
    private Music music;
    private final Handler timer = new Handler(Looper.getMainLooper());
    private final Runnable report = new Runnable() {
        @Override
        public void run() {
            web.evaluateJavascript("window.boxtileNow && boxtileNow(" + music.nowPlaying() + ")", null);
            timer.postDelayed(this, 2000);
        }
    };

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        music = new Music(this);
        web.getSettings().setUserAgentString(web.getSettings().getUserAgentString() + " BoxtileApp");
        web.setBackgroundColor(Color.rgb(29, 27, 47));
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setMediaPlaybackRequiresUserGesture(false); // lets the music player start
        web.setWebChromeClient(new WebChromeClient()); // enables the "End game?" dialog
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (!"boxtile".equals(request.getUrl().getScheme())) return false;
                if (request.isForMainFrame()) music.command(request.getUrl().getSchemeSpecificPart());
                return true;
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) offline();
            }
        });
        setContentView(web);
        web.requestFocus();
        web.loadUrl(URL);
    }

    private void offline() {
        if (isFinishing()) return;
        new AlertDialog.Builder(this).setMessage("Can't reach Boxtile. Check the internet connection.")
            .setCancelable(false)
            .setPositiveButton("Try again", (d, w) -> web.loadUrl(URL))
            .setNegativeButton("Close", (d, w) -> finish())
            .show();
    }

    @Override
    public void onBackPressed() {
        new AlertDialog.Builder(this).setMessage("Leave Boxtile?")
            .setPositiveButton("Leave", (d, w) -> finish())
            .setNegativeButton("Stay", null)
            .show();
    }

    @Override
    public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if (focused) web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
    }

    @Override
    protected void onPause() {
        timer.removeCallbacks(report);
        web.onPause(); // stops the music when you leave the app
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        timer.post(report);
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }
}
