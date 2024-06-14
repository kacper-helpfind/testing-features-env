import React from "react";
import { useLingui } from "@lingui/react";

export const LinguiTranslations: React.FC = () => {
  const { i18n } = useLingui();

  return (
    <div>
      <p>{i18n.t("Nigdy się nie poddawaj")}</p>
    </div>
  );
};

LinguiTranslations.whyDidYouRender = true;
