import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Box, } from '@mui/material'
import { styled } from '@mui/material/styles'
import NodeEditBox from '@/components/ProgressionTree/NodeEditBox'

interface Node {
  id: string
  x: number
  y: number
  color: string
  size: number
  text: string
}

// Styled Components for Canvas
const StyledCanvasContainer = styled(Box)(() => ({
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
}))

const StyledCanvas = styled('canvas')(() => ({
  backgroundColor: '#333',
}))

const ProgressionTree: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 })
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [isNodeDragging, setIsNodeDragging] = useState(false)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>()
  const [editingNode, setEditingNode] = useState<Node | null>(null)
  const [editText, setEditText] = useState<string>('')
  const [nodeSize, setNodeSize] = useState<number>(100)
  const [isEditBoxOpen, setIsEditBoxOpen] = useState<boolean>(false)
  const canvasWidth = 2040
  const canvasHeight = 963
  const gridSize = 75

  useEffect(() => {
    const initialNodes: Node[] = []
    for (let i = 0; i < 10; i++) {
      const x = Math.round((Math.random() * canvasWidth) / gridSize) * gridSize
      const y = Math.round((Math.random() * canvasHeight) / gridSize) * gridSize
      initialNodes.push({
        id: `node-${i}`,
        x: x,
        y: y,
        color: `hsl(${Math.random() * 360}, 100%, 50%)`,
        size: gridSize,
        text: `Node ${i + 1}`,
      })
    }
    setNodes(initialNodes)
  }, [])

  // Helper function to find the nearest available grid spot
  const findNearestAvailableSpot = (targetX: number, targetY: number, currentNodes: Node[]): { x: number; y: number } => {
    let bestSpot = { x: targetX, y: targetY }
    let bestDistance = Infinity

    // Check if the exact spot is available first
    const isSpotOccupied = currentNodes.some(
      (node) => node.x === bestSpot.x && node.y === bestSpot.y && node.id !== selectedNode?.id
    )

    if (!isSpotOccupied) return bestSpot

    // Otherwise check all spots around until we find one.
    for (let radius = gridSize; radius <= canvasWidth && radius <= canvasHeight; radius += gridSize) {
      for (let x = targetX - radius; x <= targetX + radius; x += gridSize) {
        for (let y = targetY - radius; y <= targetY + radius; y += gridSize) {
          if (x < 0 || x > canvasWidth || y < 0 || y > canvasHeight) continue

          const spot = { x, y }

          const isOccupied = currentNodes.some(
            (node) => node.x === spot.x && node.y === spot.y && node.id !== selectedNode?.id
          )

          if (!isOccupied) {
            const distance = Math.sqrt((spot.x - targetX) ** 2 + (spot.y - targetY) ** 2)
            if (distance < bestDistance) {
              bestDistance = distance
              bestSpot = spot
            }
          }
        }
      }
      if (bestDistance !== Infinity) break
    }

    return bestSpot
  }


  // Draw nodes and background
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background grid
    ctx.strokeStyle = '#555'
    ctx.lineWidth = 1

    for (let x = -canvasOffset.x % gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    for (let y = -canvasOffset.y % gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    if (hoverPosition && selectedNode) {
      // Draw hover square
      const hoverSize = selectedNode.size
      const hoverX = hoverPosition.x - canvasOffset.x - hoverSize / 2
      const hoverY = hoverPosition.y - canvasOffset.y - hoverSize / 2

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.strokeRect(hoverX, hoverY, hoverSize, hoverSize)
    }

    // Draw nodes
    nodes.forEach((node) => {
      // Draw square node
      const nodeSize = node.size
      const nodeX = node.x - canvasOffset.x - nodeSize / 2
      const nodeY = node.y - canvasOffset.y - nodeSize / 2

      ctx.fillStyle = node.color
      ctx.fillRect(nodeX, nodeY, nodeSize, nodeSize)
      ctx.strokeStyle = '#eee'
      ctx.strokeRect(nodeX, nodeY, nodeSize, nodeSize)

      // Draw text inside node
      ctx.fillStyle = '#fff'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(node.text, nodeX + nodeSize / 2, nodeY + nodeSize / 2)
    })
  }, [nodes, canvasOffset, hoverPosition, selectedNode, canvasWidth, canvasHeight])

  useEffect(() => {
    draw()
  }, [draw])

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.style.cursor = 'grab'

    const isNodeClicked = isMouseOverNode(event)

    if (!isNodeClicked) {
      setIsDragging(true)
    }

    const rect = canvasRef.current!.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top
    setLastMousePosition({ x: mouseX, y: mouseY })

    // Check if a node is clicked
    const clickedNode = nodes.find((node) => {
      const drawX = node.x - canvasOffset.x
      const drawY = node.y - canvasOffset.y
      const nodeHalfSize = node.size / 2 // Calculate half the size for square
      return (
        mouseX >= drawX - nodeHalfSize &&
        mouseX <= drawX + nodeHalfSize &&
        mouseY >= drawY - nodeHalfSize &&
        mouseY <= drawY + nodeHalfSize
      )
    })

    if (clickedNode) {
      setIsNodeDragging(true)
      setSelectedNode(clickedNode)
      setHoverPosition({ x: clickedNode.x, y: clickedNode.y }) // Set hover to node's initial position
    } else {
      setIsDragging(true)
    }
    setDragOffset({
      x: mouseX,
      y: mouseY,
    })
  }

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const deltaX = mouseX - lastMousePosition.x
    const deltaY = mouseY - lastMousePosition.y

    if (isDragging) {
      setCanvasOffset((prevOffset) => ({
        x: prevOffset.x - deltaX,
        y: prevOffset.y - deltaY,
      }))
      setLastMousePosition({ x: mouseX, y: mouseY })
    }

    if (isNodeDragging && selectedNode) {
      // Calculate the new node position based on mouse movement (not snapped yet)
      const newX = mouseX - dragOffset.x + selectedNode.x
      const newY = mouseY - dragOffset.y + selectedNode.y
      // Snap the position to the grid (for the hover effect)
      const snappedX = Math.round(newX / gridSize) * gridSize
      const snappedY = Math.round(newY / gridSize) * gridSize

      // Find the closest available spot.
      const { x: finalX, y: finalY } = findNearestAvailableSpot(snappedX, snappedY, nodes)

      // Update the hover position
      setHoverPosition({ x: finalX, y: finalY })

      // Update the nodes position to follow the cursor.
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === selectedNode.id ? { ...node, x: newX, y: newY } : node
        )
      )
      setLastMousePosition({ x: mouseX, y: mouseY })
    }
  }

  const handleMouseUp = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.style.cursor = 'default'

    setIsDragging(false)

    if (isNodeDragging && selectedNode) {
      // Final Snap
      const { x: finalX, y: finalY } = findNearestAvailableSpot(
        hoverPosition!.x,
        hoverPosition!.y,
        nodes
      )
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === selectedNode.id ? { ...node, x: finalX, y: finalY } : node
        )
      )
      setHoverPosition({ x: -1, y: -1 })
    }
    setIsNodeDragging(false)
    setSelectedNode(null)
  }

  const handleDoubleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    // Check if a node is double-clicked
    const doubleClickedNode = nodes.find((node) => {
      const drawX = node.x - canvasOffset.x
      const drawY = node.y - canvasOffset.y
      const nodeHalfSize = node.size / 2
      return (
        mouseX >= drawX - nodeHalfSize &&
        mouseX <= drawX + nodeHalfSize &&
        mouseY >= drawY - nodeHalfSize &&
        mouseY <= drawY + nodeHalfSize
      )
    })

    if (doubleClickedNode) {
      setEditingNode(doubleClickedNode)
      setEditText(doubleClickedNode.text)
      setSelectedNode(doubleClickedNode)
      setNodeSize(doubleClickedNode.size) //set the node size when a node is doubleclicked.
      setIsEditBoxOpen(true)
    }
  }

  const handleEditTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(event.target.value)
    if (editingNode) {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === editingNode.id ? { ...node, text: event.target.value } : node
        )
      )
    }
  }

  const handleNodeSizeChange = (event: Event, newValue: number) => {
    setNodeSize(newValue)

    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === editingNode?.id ? { ...node, size: newValue } : node
      )
    )
  }

  const handleMouseEnter = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (isMouseOverNode(event)) {
      canvas.style.cursor = 'pointer'
    } else {
      canvas.style.cursor = 'default'
    }
  }

  const isMouseOverNode = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    return nodes.some((node) => {
      const drawX = node.x - canvasOffset.x
      const drawY = node.y - canvasOffset.y
      const nodeHalfSize = node.size / 2

      return (
        mouseX >= drawX - nodeHalfSize &&
        mouseX <= drawX + nodeHalfSize &&
        mouseY >= drawY - nodeHalfSize &&
        mouseY <= drawY + nodeHalfSize
      )
    })
  }

  return (
    <StyledCanvasContainer>
      <StyledCanvas
        ref={canvasRef}
        onMouseEnter={handleMouseEnter}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />
      <NodeEditBox
        handleCloseEdit={() => setIsEditBoxOpen(false)}
        editText={editText}
        gridSize={gridSize}
        handleEditTextChange={handleEditTextChange}
        handleNodeSizeChange={handleNodeSizeChange}
        nodeSize={nodeSize}
        isOpen={isEditBoxOpen}
      />
    </StyledCanvasContainer>
  )
}

export default ProgressionTree