import Editor, { OnMount } from "@monaco-editor/react";
import { useThrottleCallback } from "@react-hook/throttle";
import merge from "deepmerge";
import { stringify } from "gray-matter";
import { Resizable } from "re-resizable";
import {
  Suspense,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";

import {
  delimiters,
  editorOptions,
  GraphOptionsObject,
} from "../lib/constants";
import { useEditorHover, useEditorOnMount } from "../lib/editorHooks";
import { useLocalStorageText } from "../lib/hooks";
import { useAppMode } from "../lib/queries";
import {
  languageId,
  themeNameDark,
  themeNameLight,
} from "../lib/registerLanguage";
import Docs from "./Docs";
import styles from "./Edit.module.css";
import EditorError from "./EditorError";
import GraphProvider from "./GraphProvider";
import helpStyles from "./Help.module.css";
import Loading from "./Loading";
import useGraphOptions from "./useGraphOptions";

export default function Help() {
  const [text, setText] = useLocalStorageText("h"); // fixed workspace name
  const [textToParse, setTextToParse] = useReducer(
    (t: string, u: string) => u,
    text
  );
  const setTextToParseThrottle = useThrottleCallback(setTextToParse, 2, true);
  const [hoverLineNumber, setHoverLineNumber] = useState<undefined | number>();
  const editorRef = useRef<null | Parameters<OnMount>[0]>(null);
  const monacoRef = useRef<any>();
  const { data: mode } = useAppMode();
  if (!mode) throw new Error(); // Cannot be undefined, query suspends
  const loading = useRef(<Loading />);
  const { graphOptions, content } = useGraphOptions(textToParse);
  useEffect(() => {
    setTextToParseThrottle(text);
  }, [text, setTextToParseThrottle]);

  const onMount = useEditorOnMount(editorRef, monacoRef);
  useEffect(() => {
    if (!monacoRef.current) return;
    monacoRef.current.editor.setTheme(
      mode === "light" ? themeNameLight : themeNameDark
    );
  }, [mode]);

  const updateGraphOptionsText = useCallback(
    (o: GraphOptionsObject) => {
      let text = "";
      if (Object.keys(graphOptions).length) {
        text = stringify(content, merge(graphOptions, o), {
          delimiters,
        });
      } else {
        // No frontmatter
        text = stringify(textToParse, o, { delimiters });
      }
      setText(text);
      setTextToParse(text);
    },
    [content, graphOptions, setText, textToParse]
  );

  // Hover
  useEditorHover(editorRef, hoverLineNumber);

  useEffect(() => {
    window.flowchartFunSetHelpText = setText;
    return () => {
      delete window.flowchartFunSetHelpText;
    };
  }, [setText]);

  const onChange = useCallback((value) => setText(value ?? ""), [setText]);

  return (
    <GraphProvider
      editable={true}
      textToParse={textToParse}
      setHoverLineNumber={setHoverLineNumber}
      graphOptions={graphOptions}
      updateGraphOptionsText={updateGraphOptionsText}
    >
      <div className={helpStyles.helpWrapper}>
        <Resizable
          defaultSize={{ width: "100%", height: "50vh" }}
          className={helpStyles.resizable}
          enable={{
            top: false,
            right: false,
            bottom: true,
            left: false,
            topRight: false,
            bottomRight: false,
            bottomLeft: false,
            topLeft: false,
          }}
        >
          <div className={helpStyles.docsWrapper}>
            <div className={helpStyles.docsWrapperScroll}>
              <Suspense fallback={<Loading />}>
                <Docs currentText={text} />
              </Suspense>
            </div>
          </div>
        </Resizable>
        <Editor
          value={text}
          wrapperClassName={styles.Editor}
          defaultLanguage={languageId}
          options={editorOptions}
          onChange={onChange}
          loading={loading.current}
          onMount={onMount}
        />
      </div>
      <EditorError />
    </GraphProvider>
  );
}

declare global {
  interface Window {
    flowchartFunSetHelpText?: (text: string) => void;
  }
}
