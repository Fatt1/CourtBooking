declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '215553515097-h52qs7fuamv6s0cbq8l667gat4g2tsan.apps.googleusercontent.com';

export const FACEBOOK_APP_ID =
  import.meta.env.VITE_FACEBOOK_APP_ID || '1118021847817546';

/**
 * Tải Google Identity Services SDK động nếu chưa có trên window
 */
export function loadGoogleSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-jssdk');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Không thể tải Google SDK')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-jssdk';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Không thể tải Google SDK'));
    document.head.appendChild(script);
  });
}

/**
 * Khởi tạo và render nút Google Sign-In vào một phần tử DOM
 */
export async function renderGoogleButton(
  container: HTMLElement,
  onSuccess: (idToken: string) => void,
  options?: {
    text?: 'signin_with' | 'signup_with' | 'continue_with';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    width?: number | string;
  }
): Promise<void> {
  await loadGoogleSdk();

  if (!window.google?.accounts?.id) {
    throw new Error('Google Identity Services chưa sẵn sàng.');
  }

  // Dọn dẹp nút cũ trước khi render nút mới (tránh trùng lặp khi re-render)
  container.innerHTML = '';

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response: any) => {
      if (response?.credential) {
        onSuccess(response.credential);
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  const parsedWidth = typeof options?.width === 'number'
    ? Math.min(Math.max(options.width, 200), 400)
    : options?.width;

  window.google.accounts.id.renderButton(container, {
    type: 'standard',
    theme: options?.theme || 'outline',
    size: options?.size || 'large',
    text: options?.text || 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: parsedWidth || 380,
    locale: 'vi',
  });
}

/**
 * Tải Facebook JavaScript SDK động nếu chưa có
 */
export function loadFacebookSdk(): Promise<void> {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v19.0',
      });
      resolve();
    };

    const existingScript = document.getElementById('facebook-jssdk');
    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/vi_VN/sdk.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
  });
}

/**
 * Mở popup đăng nhập Facebook và nhận accessToken
 */
export async function loginWithFacebook(): Promise<string> {
  await loadFacebookSdk();

  if (!window.FB) {
    throw new Error('Facebook SDK không thể khởi tạo.');
  }

  return new Promise((resolve, reject) => {
    window.FB.login(
      (response: any) => {
        if (response.authResponse?.accessToken) {
          resolve(response.authResponse.accessToken);
        } else if (response.status === 'not_authorized') {
          reject(new Error('Bạn chưa cấp quyền truy cập ứng dụng Facebook.'));
        } else {
          reject(new Error('Đăng nhập Facebook bị hủy hoặc không thành công.'));
        }
      },
      { scope: 'public_profile,email' }
    );
  });
}
