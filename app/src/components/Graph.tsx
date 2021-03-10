import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import cytoscape, {
  Core,
  EdgeSingular,
  Layouts,
  NodeSingular,
} from "cytoscape";
import { useDebouncedCallback } from "use-debounce";
import { Box, Type, Layout } from "@tone-row/slang";
import dagre from "cytoscape-dagre";
import cytoscapeSvg from "cytoscape-svg";
import { LAYOUT, lineColor, textColor } from "../constants";
import { parseText, useAnimationSetting } from "../utils";
import { Github, Twitter } from "./svgs";
import styles from "./Graph.module.css";
import { saveAs } from "file-saver";

if (!cytoscape.prototype.hasInitialised) {
  cytoscape.use(dagre);
  cytoscape.use(cytoscapeSvg);
  cytoscape.prototype.hasInitialised = true;
}

function Graph({
  textToParse,
  setHoverLineNumber,
  shouldResize,
}: {
  textToParse: string;
  setHoverLineNumber: Dispatch<SetStateAction<number | undefined>>;
  shouldResize: number;
}) {
  const cy = useRef<undefined | Core>();
  const errorCy = useRef<undefined | Core>();
  const animate = useAnimationSetting();
  const layoutSettings = useMemo(() => ({ ...LAYOUT, animate }), [animate]);
  const layout = useRef<undefined | Layouts>();

  const updateGraph = useCallback(() => {
    if (cy.current) {
      let error = false;
      let newElements: cytoscape.ElementDefinition[] = [];
      try {
        newElements = parseText(textToParse);
        errorCy.current?.json({ elements: newElements });
      } catch {
        error = true;
        errorCy.current?.destroy();
        errorCy.current = cytoscape();
      }
      if (!error) {
        cy.current.json({ elements: newElements });
        cy.current.layout(layoutSettings as any).run();
        cy.current.center();
      }
    }
  }, [layoutSettings, textToParse]);

  const handleResize = useCallback(() => {
    if (cy.current) {
      cy.current.resize();
      cy.current.animate({ fit: { padding: 6 } } as any);
    }
  }, []);

  useEffect(() => {
    handleResize();
  }, [handleResize, shouldResize]);

  const debouncedResize = useDebouncedCallback(handleResize, 250);

  useEffect(() => {
    window.addEventListener("resize", debouncedResize.callback);
    return () => window.removeEventListener("resize", debouncedResize.callback);
  }, [debouncedResize]);

  const downloadImage = useCallback(() => {
    if (cy.current) {
      // @ts-ignore
      const svgStr = cy.current.svg({ full: true, scale: 1.5 });
      const domparser = new DOMParser();
      let svgEl = domparser.parseFromString(svgStr, "image/svg+xml");
      let squares: Element[] = [
        ...svgEl.children[0].querySelectorAll("path"),
      ].filter(
        (x) =>
          !x.getAttribute("fill") &&
          x.getAttribute("paint-order") === "fill stroke markers"
      );
      squares = [...squares, ...svgEl.children[0].querySelectorAll("rect")];
      squares.forEach((el) => el.setAttribute("fill", "#ffffff"));

      // Add comment
      const originalTextComment = svgEl.createComment(
        `Original Flowchart Text (flowchart.fun):\n\n${textToParse}\n\n`
      );
      svgEl.children[0].appendChild(originalTextComment);
      const correctedSvgStr = svgEl.documentElement.outerHTML;
      saveAs(
        new Blob([correctedSvgStr], {
          type: "image/svg+xml;charset=utf-8",
        }),
        "flowchart.svg"
      );
    }
  }, [textToParse]);

  useEffect(() => {
    errorCy.current = cytoscape();
    cy.current = cytoscape({
      container: document.getElementById("cy"), // container to render in
      layout: layoutSettings,
      elements: [],
      style: [
        {
          selector: "node",
          style: {
            backgroundColor: "#FFFFFF",
            "border-color": lineColor,
            color: textColor,
            label: "data(label)",
            "font-size": 10,
            "text-wrap": "wrap",
            "text-max-width": "80",
            "text-valign": "center",
            "text-halign": "center",
            // @ts-ignore
            "line-height": 1.25,
            "border-width": 1,
            shape: "rectangle",
            "font-family":
              "-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol",
            width: "data(width)",
            height: "data(height)",
          },
        },
        {
          selector: "edge",
          style: {
            // @ts-ignore
            "loop-direction": "0deg",
            "loop-sweep": "20deg",
            width: 1,
            "text-background-opacity": 1,
            "text-background-color": "#ffffff",
            "line-color": lineColor,
            "target-arrow-color": lineColor,
            "target-arrow-shape": "vee",
            "arrow-scale": 1,
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": 10,
            "text-valign": "center",
            "font-family":
              "-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol",
            "text-halign": "center",
            // @ts-ignore
            "edge-text-rotation": "autorotate",
          },
        },
        {
          selector: ".edgeHovered",
          style: {
            "line-color": "#aaaaaa",
            "target-arrow-color": "#aaaaaa",
            color: "#aaaaaa",
          },
        },
        {
          selector: ".nodeHovered",
          style: {
            backgroundColor: "#ededec",
          },
        },
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    // Hovering Events
    function nodeHighlight(this: NodeSingular) {
      this.addClass("nodeHovered");
      setHoverLineNumber(this.data().lineNumber);
    }
    function edgeHighlight(this: EdgeSingular) {
      this.addClass("edgeHovered");
      setHoverLineNumber(this.data().lineNumber);
    }
    function unhighlight(this: NodeSingular | EdgeSingular) {
      this.removeClass("nodeHovered");
      this.removeClass("edgeHovered");
      setHoverLineNumber(undefined);
    }
    cy.current.on("mouseover", "node", nodeHighlight);
    cy.current.on("mouseover", "edge", edgeHighlight);
    cy.current.on("tapstart", "node", nodeHighlight);
    cy.current.on("tapstart", "edge", edgeHighlight);
    cy.current.on("mouseout", "node, edge", unhighlight);
    cy.current.on("tapend", "node, edge", unhighlight);

    return () => {
      cy.current?.destroy();
      errorCy.current?.destroy();
      layout.current = undefined;
    };
  }, [layoutSettings, setHoverLineNumber]);

  useEffect(() => {
    updateGraph();
  }, [updateGraph]);

  return (
    <Box className={styles.GraphContainer}>
      <Layout id="cy" />
      <Box className={styles.Buttons} p={1}>
        <div>
          <Type>Tone Row</Type>
          <a href="https://twitter.com/row_tone">
            <Twitter />
          </a>
          <a href="https://github.com/tone-row/flowchart-fun">
            <Github />
          </a>
          {/* <a
            href={`${new URL(window.location.href).origin}/r/${encodeURI(
              textToParse
            )}`}
            rel="noreferrer"
            target="_blank"
          >
            Share
          </a> */}
        </div>
        <Type as="button" onClick={downloadImage} title="Download SVG">
          Download SVG
        </Type>
      </Box>
    </Box>
  );
}

export default Graph;
