import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-2">{t("notFound")}</h2>
      <p className="text-muted-foreground mb-8">
        {t("notFoundMessage")}
      </p>
      <Button asChild>
        <Link to="/">{t("backToHome")}</Link>
      </Button>
    </div>
  );
}
