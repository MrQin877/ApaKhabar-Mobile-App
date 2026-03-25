import type { Notification } from "@/components/notification";

export const INITIAL_NOTIFS: Notification[] = [
  {
    id: "1",
    type: "community",
    title: "Posyandu gratis Jumat pukul 08.00 di balai desa",
    time: "9.00 a.m.",
    read: false,
  },
  {
    id: "2",
    type: "emergency",
    title: "DARURAT: Banjir di Dusun Cikaret, warga harap waspada",
    time: "9.00 a.m.",
    read: false,
  },
  {
    id: "3",
    type: "info",
    title: "Gotong royong Sabtu pagi pukul 07.00 di balai desa",
    time: "9.00 a.m.",
    read: true,
  },
];
