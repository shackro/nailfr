import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import type { Booking, Review, Service } from '../types';

export type AffiliateStats = {
  code: string;
  link: string;
  referrals: number;
  pending: number;
  paid: number;
  activity: { id: number; services: string[]; amount: number; commission: number; status: string; date: string }[];
};

function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'The request could not be completed.';
}

export function useServices(initialData: Service[] = []) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api<Service[]>('/services'));
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useBookings(enabled = true) {
  const [data, setData] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api<Booking[]>('/bookings'));
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (enabled) void refresh();
    else {
      setData([]);
      setLoading(false);
    }
  }, [enabled, refresh]);

  const createBooking = useCallback((booking: Omit<Booking, 'id' | 'status'>) => api('/bookings', {
    method: 'POST',
    body: JSON.stringify(booking),
  }), []);

  const updateBookingStatus = useCallback(async (id: number, status: Booking['status']) => {
    await api(`/bookings/${id}?status=${status}`, { method: 'PATCH' });
    setData((current) => current.map((booking) => booking.id === id ? { ...booking, status } : booking));
  }, []);

  return { data, setData, loading, error, refresh, createBooking, updateBookingStatus };
}

export function useAffiliateStats(code: string) {
  const [data, setData] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    if (!code) {
      setData(null);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setData(await api<AffiliateStats>(`/affiliates/${encodeURIComponent(code)}`));
    } catch (requestError) {
      setData(null);
      setError(messageOf(requestError));
    } finally {
      setLoading(false);
    }
  }, [code]);
  useEffect(() => { void refresh(); }, [refresh]);
  return { data, loading, error, refresh };
}

export function useReviews() {
  const [data, setData] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await api<Review[]>('/reviews'));
    } catch (requestError) {
      setError(messageOf(requestError));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { data, setData, loading, error, refresh };
}
