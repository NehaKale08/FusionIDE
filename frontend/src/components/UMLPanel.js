import React, { useState, useEffect, useRef } from "react";
import "./UMLPanel.css";
import mermaid from "mermaid";

export default function UMLPanel() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");

  const [erDiagram, setErDiagram] = useState(false);
  const [activityDiagram, setActivityDiagram] = useState(false);
  const [dfd0, setDfd0] = useState(false);
  const [dfd1, setDfd1] = useState(false);
  const [classDiagram, setClassDiagram] = useState(true);

  const [diagrams, setDiagrams] = useState([]);
  const diagramRefs = useRef([]);

  /* ================= INIT ================= */
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark"
    });
  }, []);

  /* ================= RENDER ================= */
  useEffect(() => {
    if (!diagrams.length) return;

    diagrams.forEach(async (d, i) => {
      const el = diagramRefs.current[i];
      if (!el) return;

      try {
        el.innerHTML = "";
        const { svg } = await mermaid.render("diagram" + i, d);
        el.innerHTML = svg;
      } catch (e) {
        console.log("Mermaid Error:", e);
        el.innerHTML = "<p style='color:red'>Invalid Diagram</p>";
      }
    });
  }, [diagrams]);

  /* ================= GENERATE ================= */
  const generateDiagram = () => {
    let result = [];

    const generateSingle = (type) => {
      const classMatches = code.match(/class\s+(\w+)/g) || [];
      const classes = classMatches.map(c => c.split(" ")[1]);

      // CLASS DIAGRAM
      if (type === "Class Diagram") {
        let diagram = "classDiagram\n";

        classes.forEach(c => {
          diagram += `${c}\n`;
        });

        if (classes.length > 1) {
          for (let i = 0; i < classes.length - 1; i++) {
            diagram += `${classes[i]} --> ${classes[i + 1]}\n`;
          }
        }

        return diagram;
      }

      // ER DIAGRAM
      if (type === "ER Diagram") {
        return `
erDiagram
USER ||--o{ ORDER : places
ORDER ||--o{ PRODUCT : contains
`;
      }

      // ACTIVITY DIAGRAM
      if (type === "Activity Diagram") {
        return `
flowchart TD
Start --> Input --> Process --> Output --> End
`;
      }

      // DFD
      if (type.includes("DFD")) {
        return `
flowchart TD
Input --> Process --> Output
`;
      }

      return `
flowchart TD
Start --> End
`;
    };

    if (classDiagram) result.push(generateSingle("Class Diagram"));
    if (activityDiagram) result.push(generateSingle("Activity Diagram"));
    if (erDiagram) result.push(generateSingle("ER Diagram"));
    if (dfd0) result.push(generateSingle("DFD Level 0"));
    if (dfd1) result.push(generateSingle("DFD Level 1"));

    setDiagrams(result);
  };

  /* ================= SAVE ================= */
  const downloadDiagram = (index) => {
    const svg = diagramRefs.current[index]?.querySelector("svg");
    if (!svg) return;

    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `diagram_${index}.svg`;
    link.click();
  };

  /* ================= COPY ================= */
  const copyDiagram = async (index) => {
    const el = diagramRefs.current[index];

    try {
      await navigator.clipboard.writeText(el.innerText);
      alert("Copied!");
    } catch {
      alert("Copy failed");
    }
  };

  return (
    <>
      {!open && (
        <div className="uml-button" onClick={() => setOpen(true)}>
          📈
        </div>
      )}

      {open && (
        <div className="uml-container">
          <div className="uml-header">
            <span>📈 UML Generator</span>
            <button onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="uml-body">
            <textarea
              placeholder="Paste your Java code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />

            <div className="uml-options">
              <label>
                <input type="checkbox" checked={erDiagram} onChange={() => setErDiagram(!erDiagram)} /> ER Diagram
              </label>
              <label>
                <input type="checkbox" checked={activityDiagram} onChange={() => setActivityDiagram(!activityDiagram)} /> Activity Diagram
              </label>
              <label>
                <input type="checkbox" checked={dfd0} onChange={() => setDfd0(!dfd0)} /> DFD Level 0
              </label>
              <label>
                <input type="checkbox" checked={dfd1} onChange={() => setDfd1(!dfd1)} /> DFD Level 1
              </label>
              <label>
                <input type="checkbox" checked={classDiagram} onChange={() => setClassDiagram(!classDiagram)} /> Class Diagram
              </label>
            </div>

            <button className="generate-btn" onClick={generateDiagram}>
              Generate
            </button>

            <div className="uml-images">
              {diagrams.map((d, index) => (
                <div key={index} className="uml-image-card">
                  <div
                    className="mermaid"
                    ref={(el) => (diagramRefs.current[index] = el)}
                  ></div>

                  <div className="uml-actions">
                    <button onClick={() => downloadDiagram(index)}>Save</button>
                    <button onClick={() => copyDiagram(index)}>Copy</button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}
    </>
  );
}
