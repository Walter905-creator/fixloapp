import Logo from '../assets/brand/fixlo-logo-2025.svg';

export default function HeaderLogo() {
  return <img src={Logo} alt="Fixlo" width={148} height={40} fetchpriority="high" />;
}