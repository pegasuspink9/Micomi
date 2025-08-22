import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../../utils/response';

const router = Router();
const prisma = new PrismaClient();

// GET /api/maps - Get all maps with levels and admin info
router.get('/', async (req, res) => {
  try {
    const maps = await prisma.map.findMany({
      include: {
        admin: true,
        levels: {
          orderBy: { level_number: 'asc' }
        }
      },
      orderBy: { map_id: 'asc' }
    });

    return successResponse(res, maps, "All maps fetched");
  } catch (error) {
    console.error('Error fetching maps:', error);
    return errorResponse(res, error, "Failed to fetch maps", 500);
  }
});

// GET /api/maps/:id - Get specific map
router.get('/:id', async (req, res) => {
  try {
    const mapId = parseInt(req.params.id);
    
    const map = await prisma.map.findUnique({
      where: { map_id: mapId },
      include: {
        admin: true,
        levels: {
          orderBy: { level_number: 'asc' }
        }
      }
    });

    if (!map) {
      return errorResponse(res, null, "Map not found", 404);
    }

    return successResponse(res, map, "Map fetched successfully");
  } catch (error) {
    console.error('Error fetching map:', error);
    return errorResponse(res, error, "Failed to fetch map", 500);
  }
});

// POST /api/maps/select - Select a map (from your existing controller)
router.post('/select', async (req, res) => {
  try {
    const { playerId, mapId } = req.body;
    
    if (!playerId || !mapId) {
      return errorResponse(res, null, "Player ID and Map ID are required", 400);
    }

    // You can implement your map selection logic here
    // For now, just return success
    const result = { playerId, mapId, selected: true };
    
    return successResponse(res, result, "Map selected successfully");
  } catch (error) {
    console.error('Error selecting map:', error);
    return errorResponse(res, error, "Failed to select map", 500);
  }
});

// PUT /api/maps/:id - Update map
router.put('/:id', async (req, res) => {
  try {
    const mapId = parseInt(req.params.id);
    const updateData = req.body;

    const updatedMap = await prisma.map.update({
      where: { map_id: mapId },
      data: updateData,
      include: {
        admin: true,
        levels: {
          orderBy: { level_number: 'asc' }
        }
      }
    });

    return successResponse(res, updatedMap, "Map updated successfully");
  } catch (error) {
    console.error('Error updating map:', error);
    return errorResponse(res, error, "Failed to update map", 500);
  }
});

export default router;
