// This file holds the main code for the plugin. It has access to the *document*.
// You can access browser APIs such as the network by creating a UI which contains
// a full browser environment (see documentation).

function findAllTextStringsAndIds(): { nodeText: string[]; nodeId: string[] } {
  const textNodes = figma.root.findAll(
    node => node.type === "TEXT" && node.characters.length > 0
  ) as TextNode[];

  const nodeId = textNodes.map(node => node.id);
  const nodeText = textNodes.map(textNode => textNode.characters);

  return { nodeText, nodeId };
}

// Runs this code if the plugin is run in Figma
if (figma.editorType === 'figma') {
  var mistakeData = [];
  // This plugin will open a window to prompt the user to enter a number, and
  // it will then create that many rectangles on the screen.

  // This shows the HTML page in "ui.html".
  figma.showUI(__html__, { themeColors: true });

  var allNodes = findAllTextStringsAndIds();

  console.log("Loading all text elements");

  for (var currentNode in allNodes.nodeText) {
    // figma.ui.postMessage(allNodes.nodeText[currentNode]);
    mistakeData.push({nodeId: allNodes.nodeId[currentNode], nodeText: allNodes.nodeText[currentNode]});
  }

  figma.ui.postMessage(mistakeData);

  figma.ui.onmessage = async (msg) => {
    if (msg.type == "SELECT") {
      var selectNode = figma.root.findOne(node => node.id === msg.nodeId);
      if (selectNode?.type == "TEXT") {
        figma.currentPage.selectedTextRange = { node: selectNode, start: parseInt(msg.textStart), end: parseInt(msg.textEnd) };
        if (selectNode.parent !== null) {
          figma.viewport.scrollAndZoomIntoView([selectNode]);
        }
        console.log("Text Selected");
      }
      //figma.currentPage.selection = selection;
    } else if (msg.type == "RESIZE") {
      figma.ui.resize(300, parseInt(msg.height))
    } else if (msg.type == "REFRESH") {
      var mistakeData = [];
      for (var currentNode in allNodes.nodeText) {
        // figma.ui.postMessage(allNodes.nodeText[currentNode]);
        mistakeData.push({nodeId: allNodes.nodeId[currentNode], nodeText: allNodes.nodeText[currentNode]});
      }
      figma.ui.postMessage(mistakeData);
    }
  }
// If the plugins isn't run in Figma, run this code
} else {
  // This plugin will open a window to prompt the user to enter a number, and
  // it will then create that many shapes and connectors on the screen.

  // This shows the HTML page in "ui.html".
  figma.showUI(__html__);

  // Calls to "parent.postMessage" from within the HTML page will trigger this
  // callback. The callback will be passed the "pluginMessage" property of the
  // posted message.
  figma.ui.onmessage = msg => {
    // One way of distinguishing between different types of messages sent from
    // your HTML page is to use an object with a "type" property like this.
    if (msg.type === 'create-shapes') {
      const numberOfShapes = msg.count;
      const nodes: SceneNode[] = [];
      for (let i = 0; i < numberOfShapes; i++) {
        const shape = figma.createShapeWithText();
        // You can set shapeType to one of: 'SQUARE' | 'ELLIPSE' | 'ROUNDED_RECTANGLE' | 'DIAMOND' | 'TRIANGLE_UP' | 'TRIANGLE_DOWN' | 'PARALLELOGRAM_RIGHT' | 'PARALLELOGRAM_LEFT'
        shape.shapeType = 'ROUNDED_RECTANGLE'
        shape.x = i * (shape.width + 200);
        shape.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
        figma.currentPage.appendChild(shape);
        nodes.push(shape);
      };

      for (let i = 0; i < (numberOfShapes - 1); i++) {
        const connector = figma.createConnector();
        connector.strokeWeight = 8

        connector.connectorStart = {
          endpointNodeId: nodes[i].id,
          magnet: 'AUTO',
        };

        connector.connectorEnd = {
          endpointNodeId: nodes[i+1].id,
          magnet: 'AUTO',
        };
      };

      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
    }

    // Make sure to close the plugin when you're done. Otherwise the plugin will
    // keep running, which shows the cancel button at the bottom of the screen.
    figma.closePlugin();
  };
};
