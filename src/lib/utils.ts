import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(date: string | Date | null | undefined) {
    if (!date) return '-';
    let parsedDate: Date;
    if (typeof date === 'string') {
        // Replace dashes with slashes for safe Safari parsing as local time
        parsedDate = new Date(date.replace(/-/g, '/').replace('T', ' '));
    } else {
        parsedDate = date;
    }
    
    // Check for invalid date
    if (isNaN(parsedDate.getTime())) return '-';
    
    try {
        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }).format(parsedDate);
    } catch (e) {
        return '-';
    }
}

export function formatTime(date: string | Date | null | undefined) {
    if (!date) return '-';
    let parsedDate: Date;
    if (typeof date === 'string') {
        // Replace dashes with slashes for safe Safari parsing as local time
        parsedDate = new Date(date.replace(/-/g, '/').replace('T', ' '));
    } else {
        parsedDate = date;
    }
    
    // Check for invalid date
    if (isNaN(parsedDate.getTime())) return '-';

    try {
        return new Intl.DateTimeFormat("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        }).format(parsedDate);
    } catch (e) {
        return '-';
    }
}

export function stripHtml(html: string) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}
