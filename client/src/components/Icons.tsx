// Boxicons component for consistent icon usage across the app
// More icons available at: https://boxicons.com

interface IconProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

// User/Profile Icons
export const UserIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

export const UserCheckIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
  </svg>
);

// Email/Contact Icons
export const EmailIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);

export const PhoneIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

// Location/Address Icons
export const MapPinIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-5-9h10v2H7z"/>
  </svg>
);

export const LocationIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// Security/Lock Icons
export const LockIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export const ShieldIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

// Payment Icons
export const CreditCardIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

export const WalletIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 0 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-3.5a1 1 0 0 0-1-1"/>
  </svg>
);

export const DollarSignIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

// Navigation Icons
export const ChevronRightIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

export const ChevronLeftIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);

export const ArrowRightIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

export const ArrowLeftIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

// Status Icons
export const CheckCircleIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
);

export const AlertCircleIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export const InfoIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>
);

// Cart/Shopping Icons
export const ShoppingCartIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

export const ShoppingBagIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

// Action Icons
export const CopyIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
  </svg>
);

export const DownloadIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export const LoaderIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className} animate-spin`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6a6 6 0 0 1 0 12"/>
  </svg>
);

// QR Code Icon
export const QrCodeIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="2" width="7" height="7" fill="currentColor"/>
    <rect x="15" y="2" width="7" height="7" fill="currentColor"/>
    <rect x="2" y="15" width="7" height="7" fill="currentColor"/>
    <rect x="10" y="10" width="2" height="2" fill="currentColor"/>
    <rect x="12" y="10" width="2" height="2" fill="currentColor"/>
    <rect x="10" y="12" width="2" height="2" fill="currentColor"/>
    <rect x="15" y="15" width="7" height="7" fill="currentColor"/>
  </svg>
);

// Menu & Search Icons
export const MenuIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

export const SearchIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

export const XIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6l-12 12M6 6l12 12"/>
  </svg>
);

export const HeartIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

// Payment Method Icons
export const PixIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="currentColor">
    <rect x="3" y="3" width="8" height="8" rx="1"/>
    <rect x="13" y="3" width="8" height="8" rx="1"/>
    <rect x="3" y="13" width="8" height="8" rx="1"/>
    <rect x="13" y="13" width="8" height="8" rx="1"/>
  </svg>
);

export const BoletoIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
    <line x1="9" y1="17" x2="15" y2="17"/>
  </svg>
);

export const CreditCardVisaIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
    <circle cx="6" cy="17" r="1" fill="currentColor"/>
    <line x1="9" y1="16" x2="9" y2="18"/>
  </svg>
);

export const DebitCardIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
    <circle cx="6" cy="17" r="1" fill="currentColor"/>
    <line x1="10" y1="15" x2="14" y2="15"/>
  </svg>
);

export const TrackingIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6"/>
    <path d="M12 9v6m0 0l2.5-2.5M12 15l-2.5-2.5"/>
  </svg>
);
