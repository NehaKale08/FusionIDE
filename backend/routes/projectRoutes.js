const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

/* -------------------------------
   Create new project folder
--------------------------------*/
router.post("/create", (req, res) => {
  const { projectName, projectPath } = req.body;

  const fullPath = path.join(projectPath, projectName);

  if (fs.existsSync(fullPath)) {
    return res.status(400).json({ msg: "Folder already exists" });
  }

  fs.mkdirSync(fullPath, { recursive: true });

  res.json({ msg: "Project created", path: fullPath });
});

/* -------------------------------
   Get folder tree structure
--------------------------------*/
router.post("/tree", (req, res) => {
  const { folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({ msg: "folderPath is missing" });
  }

  if (!fs.existsSync(folderPath)) {
    return res.status(400).json({
      msg: "Folder does not exist",
      folderPath,
    });
  }

  function readDirRecursive(dir) {
    let items;
    try {
      items = fs.readdirSync(dir);
    } catch (err) {
      console.log("READDIR FAILED:", dir, err.message);
      return [];
    }

    return items
      .map((item) => {
        const fullItemPath = path.join(dir, item);

        let stat;
        try {
          stat = fs.statSync(fullItemPath);
        } catch (err) {
          console.log("STAT FAILED:", fullItemPath, err.message);
          return null;
        }

        if (!stat) return null;

        if (stat.isDirectory()) {
          return {
            type: "folder",
            name: item,
            path: fullItemPath,
            children: readDirRecursive(fullItemPath),
          };
        }

        return {
          type: "file",
          name: item,
          path: fullItemPath,
        };
      })
      .filter(Boolean);
  }

  try {
    const tree = readDirRecursive(folderPath);
    return res.json(tree);
  } catch (err) {
    console.log("TREE API CRASH:", err);
    return res.status(500).json({
      msg: "Tree read failed",
      error: err.message,
    });
  }
});

/* -------------------------------
   ✅ Read file content (FIXED)
--------------------------------*/
router.post("/read-file", (req, res) => {
  const filePath = req.body.path; // ✅ frontend sends "path"

  console.log("📌 Requested file:", filePath);

  if (!filePath) {
    return res.status(400).json({
      msg: "File path missing",
    });
  }

  const fixedPath = path.normalize(filePath);

  try {
    const content = fs.readFileSync(fixedPath, "utf-8");
    res.json({ content });
  } catch (err) {
    console.log("❌ FILE READ ERROR:", err.message);

    res.status(500).json({
      msg: "Cannot read file",
      error: err.message,
    });
  }
});

/* -------------------------------
   ✅ Save file content (FIXED URL)
--------------------------------*/
router.post("/save-file", (req, res) => {
  const filePath = req.body.path;
  const content = req.body.content;

  if (!filePath) {
    return res.status(400).json({ msg: "File path missing" });
  }

  try {
    fs.writeFileSync(path.normalize(filePath), content);
    res.json({ msg: "File saved successfully" });
  } catch (err) {
    res.status(500).json({
      msg: "Cannot save file",
      error: err.message,
    });
  }
});

/* -------------------------------
   ✅ Create new file (FIXED URL)
--------------------------------*/
router.post("/create-file", (req, res) => {
  const { path: folderPath, name } = req.body;

  const fullFilePath = path.join(folderPath, name);

  try {
    fs.writeFileSync(fullFilePath, "");
    res.json({ msg: "File created", path: fullFilePath });
  } catch (err) {
    res.status(500).json({
      msg: "Cannot create file",
      error: err.message,
    });
  }
});

/* -------------------------------
   ✅ Create new folder (FIXED URL)
--------------------------------*/
router.post("/create-folder", (req, res) => {
  const { path: folderPath, name } = req.body;

  const fullFolderPath = path.join(folderPath, name);

  try {
    fs.mkdirSync(fullFolderPath);
    res.json({ msg: "Folder created", path: fullFolderPath });
  } catch (err) {
    res.status(500).json({
      msg: "Cannot create folder",
      error: err.message,
    });
  }
});

module.exports = router;