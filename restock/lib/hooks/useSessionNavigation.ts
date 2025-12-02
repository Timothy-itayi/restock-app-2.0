import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

/**
 * Centralises all navigation related to the session/email flow so that
 * every screen uses the same behaviour (push vs replace, root paths, etc.).
 */
export function useSessionNavigation() {
  const router = useRouter();

  const openAddProduct = useCallback(
    (sessionId: string) => router.push(`/sessions/${sessionId}/add-product`),
    [router]
  );

  const openEditProduct = useCallback(
    (sessionId: string, itemId: string) =>
      router.push(`/sessions/${sessionId}/edit-product/${itemId}`),
    [router]
  );

  const openEmailPreview = useCallback(
    (sessionId: string) =>
      router.push({
        pathname: '/sessions/[id]/email-preview',
        params: { id: sessionId },
      }),
    [router]
  );

  const goToSessionList = useCallback(
    () => router.replace('/sessions'),
    [router]
  );

  const goToDashboard = useCallback(
    () => router.replace('/'),
    [router]
  );

  const goBack = useCallback(() => router.back(), [router]);

  return useMemo(
    () => ({
      openAddProduct,
      openEditProduct,
      openEmailPreview,
      goToSessionList,
      goToDashboard,
      goBack,
    }),
    [
      openAddProduct,
      openEditProduct,
      openEmailPreview,
      goToSessionList,
      goToDashboard,
      goBack,
    ]
  );
}

