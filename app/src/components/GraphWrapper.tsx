import React, { ReactNode, useContext } from "react";
import { Box } from "../slang";
import styles from "./GraphWrapper.module.css";
import { LayoutContext } from "./Layout";

export default function GraphWrapper({ children }: { children: ReactNode }) {
  const { showing } = useContext(LayoutContext);

  return (
    <Box className={styles.GraphWrapper} data-showing={showing}>
      {children}
    </Box>
  );
}
