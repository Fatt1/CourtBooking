import { useState, useCallback } from 'react';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeolocationState {
  location: LocationCoordinates | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook lấy toạ độ GPS hiện tại của người dùng qua HTML5 Geolocation API
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    isLoading: false,
    error: null,
  });

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Trình duyệt của bạn không hỗ trợ định vị GPS.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          },
          isLoading: false,
          error: null,
        });
      },
      (err) => {
        let message = 'Không thể lấy toạ độ vị trí.';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            message = 'Bạn đã từ chối cấp quyền truy cập vị trí.';
            break;
          case err.POSITION_UNAVAILABLE:
            message = 'Thông tin vị trí hiện không khả dụng.';
            break;
          case err.TIMEOUT:
            message = 'Yêu cầu lấy vị trí đã hết thời gian chờ.';
            break;
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000 * 60 * 5, // 5 phút cache
      }
    );
  }, []);

  return {
    location: state.location,
    isLoading: state.isLoading,
    error: state.error,
    getCurrentLocation,
  };
}
