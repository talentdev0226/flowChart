import { memo, ReactNode, useCallback, useContext } from "react";
import { Box, BoxProps, Type } from "../slang";
import styles from "./Settings.module.css";
import { AppContext } from "./AppContext";
import { Trans } from "@lingui/macro";
import { languages } from "../locales/i18n";
import { Page, Section, SectionTitle } from "./Shared";

const lowerLinksAt: BoxProps["at"] = {
  tablet: {
    pb: 4,
  },
  desktop: {
    gap: 4,
    flow: "column",
    items: "end normal",
    content: "normal start",
  },
};

const Settings = memo(() => {
  const { updateUserSettings, mode, language } = useContext(AppContext);
  const setLightMode = useCallback(() => {
    document.body.classList.add("disableAnimation");
    updateUserSettings({ mode: "light" });
    window.plausible("Set Appearance", { props: { mode: "light" } });
    setTimeout(() => document.body.classList.remove("disableAnimation"), 100);
  }, [updateUserSettings]);
  const setDarkMode = useCallback(() => {
    document.body.classList.add("disableAnimation");
    updateUserSettings({ mode: "dark" });
    window.plausible("Set Appearance", { props: { mode: "dark" } });
    setTimeout(() => document.body.classList.remove("disableAnimation"), 100);
  }, [updateUserSettings]);
  const changeLanguage = useCallback(
    (l: string) => {
      updateUserSettings({ language: l });
      window.plausible("Set Language", { props: { language: l } });
    },
    [updateUserSettings]
  );

  return (
    <Box px={4} pb={4} pt={2} className={styles.Settings}>
      <Page items="start" content="start">
        <Section>
          <SectionTitle>
            <Trans>Language</Trans>
          </SectionTitle>
          <Box
            gap={1}
            items="normal start"
            at={{ tablet: { flow: "column", gap: 4 } }}
          >
            {Object.keys(languages).map((locale) => (
              <Box
                as="button"
                key={locale}
                className={styles.Language}
                disabled={language === locale}
                onClick={() => changeLanguage(locale)}
                aria-label={`Select Language: ${
                  languages[locale as keyof typeof languages]
                }`}
              >
                <Type size={-1}>
                  {languages[locale as keyof typeof languages]}
                </Type>
              </Box>
            ))}
          </Box>
        </Section>
        <Section>
          <SectionTitle>
            <Trans>Appearance</Trans>
          </SectionTitle>
          <Box flow="column">
            <GroupButton
              disabled={mode === "light"}
              aria-pressed={mode === "light"}
              aria-label="Light Mode"
              onClick={setLightMode}
            >
              <Trans>Light Mode</Trans>
            </GroupButton>
            <GroupButton
              disabled={mode === "dark"}
              aria-pressed={mode === "dark"}
              aria-label="Dark Mode"
              onClick={setDarkMode}
            >
              <Trans>Dark Mode</Trans>
            </GroupButton>
          </Box>
        </Section>
        <Section className={styles.LowerLinks}>
          <SectionTitle as="a" href="https://tone-row.com">
            <Trans>
              Made by <strong>Tone Row</strong>
            </Trans>
          </SectionTitle>
          <Section at={lowerLinksAt}>
            <Type as="a" href="https://twitter.com/tone_row_" size={-1}>
              <Trans>Follow Us</Trans>
            </Type>
            <Type
              as="a"
              href="https://github.com/tone-row/flowchart-fun"
              size={-1}
            >
              <Trans>View on Github</Trans>
            </Type>
            <Type
              as="a"
              href="https://opencollective.com/tone-row/donate"
              size={-1}
              onClick={() => window.plausible("Make a Donation")}
            >
              <Trans>Make a Donation</Trans>
            </Type>
            <Type
              as="a"
              href="https://github.com/sponsors/tone-row"
              size={-1}
              onClick={() => window.plausible("Become a Sponsor")}
            >
              <Trans>Become a Sponsor</Trans>
            </Type>
          </Section>
        </Section>
      </Page>
    </Box>
  );
});

Settings.displayName = "Settings";

export default Settings;

const GroupButton = memo(
  ({ children, ...props }: { children: ReactNode } & BoxProps) => {
    return (
      <Box as="button" p={3} className={styles.GroupButton} {...props}>
        <Type size={-1}>{children}</Type>
      </Box>
    );
  }
);

GroupButton.displayName = "GroupButton";
