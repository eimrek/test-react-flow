import React, { useState, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

const API_URL = "https://aiida.materialscloud.org/autowannier/api/v4/";

const UUID = "9333b9e3-ae02-4c5c-9e9a-9e666b20c211";

const CENTRAL_X = 600;
const CENTRAL_Y = 600;
const INPUT_X = 200;
const OUTPUT_X = 1000;

const LIMIT = 3;

async function fetchLinks(fullType, limit, direction = "incoming", offset = 0) {
  let url = `${API_URL}/nodes/${UUID}/links/${direction}`;
  url += `?orderby=+ctime&full_type="${fullType}"&limit=${limit}&offset=${offset}`;

  try {
    const response = await fetch(url);
    const result = await response.json();
    const totalCount = response.headers.get("X-Total-Count");

    if (direction === "incoming") {
      return {
        totalCount: totalCount,
        links: result.data.incoming,
      };
    } else {
      return {
        totalCount: totalCount,
        links: result.data.outgoing,
      };
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function fetchAllLinks() {
  try {
    const inputLogical = await fetchLinks(
      "process.%25%7C%25",
      LIMIT,
      "incoming"
    );
    const inputData = await fetchLinks("data.%25%7C%25", LIMIT, "incoming");
    const outputLogical = await fetchLinks(
      "process.%25%7C%25",
      LIMIT,
      "outgoing"
    );
    const outputData = await fetchLinks("data.%25%7C%25", LIMIT, "outgoing");
    return {
      inputLogical: inputLogical,
      inputData: inputData,
      outputLogical: outputLogical,
      outputData: outputData,
    };
  } catch (error) {
    console.error("Error:", error);
  }
}

function convertLinksToNodesAndEdges(links, central) {
  let nodes = [central];
  let edges = [];

  // format LOGICAL INPUT LINKS
  let y = CENTRAL_Y - 200;
  links.inputLogical.links
    .slice()
    .reverse()
    .forEach((element) => {
      nodes.push({
        id: element.uuid,
        data: { label: element.uuid },
        position: { x: INPUT_X, y: y },
        sourcePosition: "right",
        targetPosition: "left",
        color: "yellow",
      });
      y -= 50;
      edges.push({
        id: `${element.uuid}-${central.id}`,
        source: element.uuid,
        target: central.id,
      });
    });

  // format LOGICAL DATA LINKS
  y = CENTRAL_Y;
  links.inputData.links.forEach((element) => {
    nodes.push({
      id: element.uuid,
      data: { label: element.uuid },
      position: { x: INPUT_X, y: y },
      sourcePosition: "right",
      targetPosition: "left",
      style: { backgroundColor: "lightgreen" },
    });
    y += 100;
    edges.push({
      id: `${element.uuid}-${central.id}`,
      source: element.uuid,
      target: central.id,
    });
  });

  if (links.inputData.links.length < links.inputData.totalCount) {
    nodes.push({
      id: "abc",
      data: { label: "Load more" },
      position: { x: INPUT_X, y: y },
      sourcePosition: "right",
      targetPosition: "left",
      style: { backgroundColor: "lightblue" },
    });
    y += 100;
    edges.push({
      id: `abc-${central.id}`,
      source: "abc",
      target: central.id,
    });
  }

  // format LOGICAL OUTPUT LINKS
  y = CENTRAL_Y - 150;
  links.outputLogical.links
    .slice()
    .reverse()
    .forEach((element) => {
      nodes.push({
        id: element.uuid,
        data: { label: element.uuid },
        position: { x: OUTPUT_X, y: y },
        sourcePosition: "right",
        targetPosition: "left",
        style: { backgroundColor: "yellow" },
      });
      y -= 100;
      edges.push({
        id: `${element.uuid}-${central.id}`,
        source: central.id,
        target: element.uuid,
        style: { strokeDasharray: "5,5" },
      });
    });

  // format DATA OUTPUT LINKS
  y = CENTRAL_Y;
  links.outputData.links.forEach((element) => {
    nodes.push({
      id: element.uuid,
      data: { label: element.uuid },
      position: { x: OUTPUT_X, y: y },
      sourcePosition: "right",
      targetPosition: "left",
      style: { backgroundColor: "lightgreen" },
    });
    y += 100;
    edges.push({
      id: `${element.uuid}-${central.id}`,
      source: central.id,
      target: element.uuid,
    });
  });

  return { nodes: nodes, edges: edges };
}

const centralNode = {
  id: UUID,
  position: { x: CENTRAL_X, y: CENTRAL_Y },
  data: { label: UUID },
  sourcePosition: "right",
  targetPosition: "left",
};

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([centralNode]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    fetchAllLinks().then((links) => {
      console.log(links);
      let result = convertLinksToNodesAndEdges(links, centralNode);

      console.log(result);

      setNodes(result.nodes);
      setEdges(result.edges);
    });
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
