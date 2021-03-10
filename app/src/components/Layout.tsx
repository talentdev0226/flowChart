import { Layout as SlangLayout } from "@tone-row/slang";
import styles from "./Layout.module.css";
import { Resizable } from "re-resizable";
import React, { Dispatch, ReactNode, SetStateAction, useState } from "react";
import Graph from "./Graph";

export default function Layout({
  children,
  textToParse,
  setHoverLineNumber,
}: {
  children?: ReactNode;
  textToParse: string;
  setHoverLineNumber: Dispatch<SetStateAction<number | undefined>>;
}) {
  const [shouldResize, triggerResize] = useState(0);
  return (
    <SlangLayout className={styles.App}>
      <Resizable
        defaultSize={{
          width: "50%",
          height: "auto",
        }}
        maxWidth="90%"
        minWidth="10%"
        enable={{ right: true }}
        className={styles.TextareaContainer}
        handleClasses={{ right: styles.resizableHandle }}
        onResizeStop={() => triggerResize((n) => n + 1)}
      >
        {children}
      </Resizable>
      <Graph
        textToParse={textToParse}
        setHoverLineNumber={setHoverLineNumber}
        shouldResize={shouldResize}
      />
      <div id="resizer" className={styles.resizer} />
    </SlangLayout>
  );
}
