const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { authJwt } = require("../../middlewares/auth");
const { pricingController } = require("../../controllers/pricingController");

/**
 * @swagger
 * tags:
 *   name: Pricing
 *   description: API endpoints for managing pricing plans and FAQs
 */

/**
 * @swagger
 * /api/pricing/{entityType}:
 *   get:
 *     summary: Get pricing data and FAQs for a specific entity type
 *     tags: [Pricing]
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [institution, student, teacher]
 *         description: The type of entity to get pricing for
 *     responses:
 *       200:
 *         description: Pricing data and FAQs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EntityPricingData'
 *       400:
 *         description: Invalid entity type
 *       500:
 *         description: Internal server error
 */
router.get(
  "/:entityType",
  [check("entityType").isIn(["institution", "student", "teacher"])],
  pricingController.getPricingData
);

/**
 * @swagger
 * /api/pricing:
 *   get:
 *     summary: Get all pricing data and FAQs (Admin only)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All pricing data and FAQs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     $ref: '#/components/schemas/EntityPricingData'
 *       401:
 *         description: Unauthorized - Admin access required
 *       500:
 *         description: Internal server error
 */
router.get(
  "/",

  pricingController.getAllPricingData
);

module.exports = router;
