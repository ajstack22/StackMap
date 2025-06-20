package com.stackmap.app;

import android.content.Context;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;

import androidx.annotation.Nullable;

import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeWebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

public class OfflineManager extends BridgeWebViewClient {
    private static final String OFFLINE_PAGE = "offline.html";
    private final Context context;
    
    public OfflineManager(Bridge bridge) {
        super(bridge);
        this.context = bridge.getContext();
    }
    
    @Nullable
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
        // Check if device is offline and request is for the main app
        if (!isNetworkAvailable() && isMainAppRequest(request)) {
            return loadOfflinePage();
        }
        
        return super.shouldInterceptRequest(view, request);
    }
    
    private boolean isMainAppRequest(WebResourceRequest request) {
        String url = request.getUrl().toString();
        return url.contains("index.html") || url.endsWith("/");
    }
    
    private boolean isNetworkAvailable() {
        // This is handled by the service worker, but we can add additional checks here
        return true; // Let service worker handle offline functionality
    }
    
    @Nullable
    private WebResourceResponse loadOfflinePage() {
        try {
            InputStream inputStream = context.getAssets().open("public/" + OFFLINE_PAGE);
            return new WebResourceResponse("text/html", "utf-8", inputStream);
        } catch (IOException e) {
            // Return a basic offline message if offline.html is not found
            String offlineHtml = "<html><body><h1>You're offline</h1><p>Please check your connection.</p></body></html>";
            ByteArrayInputStream stream = new ByteArrayInputStream(offlineHtml.getBytes(StandardCharsets.UTF_8));
            return new WebResourceResponse("text/html", "utf-8", stream);
        }
    }
}