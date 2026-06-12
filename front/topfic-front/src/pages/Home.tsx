import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-4xl md:text-6xl font-bold mb-6">
        {t("welcome")}
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl mb-8">
        {t("tagline")}
      </p>
      <div className="flex gap-4">
        <Button size="lg" asChild>
          <Link to="/search">{t("startExploring")}</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/auth/register">{t("joinNow")}</Link>
        </Button>
      </div>
    </div>
  );
}
