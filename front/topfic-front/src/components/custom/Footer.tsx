import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-primary border-t border-border mt-0">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex items-center justify-between gap-4 text-primary-foreground">
        <div className="flex flex-col items-start gap-2">
          <Link to="/" className="text-sm hover:underline">
            {t("footerAbout")}
          </Link>
          <Link to="/" className="text-sm hover:underline">
            {t("footerPrivacy")}
          </Link>
          <Link to="/" className="text-sm hover:underline">
            {t("footerTerms")}
          </Link>
        </div>

        <div className="flex flex-col items-start gap-2">
          <Link to="/faq" className="text-sm hover:underline">
            {t("footerFAQ")}
          </Link>
          <a href="mailto:contact@topfiction.com" className="text-sm hover:underline">
            {t("footerContact")}
          </a>
        </div>

        <div className="text-sm">
          &copy; {new Date().getFullYear()} TopFiction
        </div>
      </div>
    </footer>
  );
};

export default Footer;
