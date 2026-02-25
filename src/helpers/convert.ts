import type { Types } from '@cornerstonejs/core';
import { parseAffineMatrix } from './affineUtilities';

/**
 * This converts scalar data: LPS to RAS and RAS to LPS
 */
const invertDataPerFrame = (dimensions, imageDataArray) => {
  let TypedArrayConstructor;
  let bytesPerVoxel;

  if (
    imageDataArray instanceof Uint8Array ||
    imageDataArray instanceof ArrayBuffer
  ) {
    TypedArrayConstructor = Uint8Array;
    bytesPerVoxel = 1;
  } else if (imageDataArray instanceof Int16Array) {
    TypedArrayConstructor = Int16Array;
    bytesPerVoxel = 2;
  } else if (imageDataArray instanceof Float32Array) {
    TypedArrayConstructor = Float32Array;
    bytesPerVoxel = 4;
  } else {
    throw new Error(
      'imageDataArray needs to be a Uint8Array, Int16Array or Float32Array.'
    );
  }

  // Make a copy of the data first using the browser native fast TypedArray.set().
  const newImageDataArray = new TypedArrayConstructor(
    imageDataArray.byteLength
  );

  const view = new TypedArrayConstructor(imageDataArray);

  newImageDataArray.set(view);

  // In order to switch from LP to RA within each slice, we just need to reverse each section.
  // We can do this in place using web api which is very fast, by taking views on different parts of a single buffer.

  const numFrames = dimensions[2];
  const frameLength = dimensions[0] * dimensions[1];
  const buffer = newImageDataArray.buffer;

  for (let frame = 0; frame < numFrames; frame++) {
    const byteOffset = frameLength * frame * bytesPerVoxel;
    // Get view of underlying buffer for this frame.
    const frameView = new TypedArrayConstructor(
      buffer,
      byteOffset,
      frameLength
    );

    frameView.reverse();
  }

  return newImageDataArray;
};

function correctAffine(affine) {
  // 提取旋转和平移
  const R = [
    [affine[0][0], affine[0][1], affine[0][2]],
    [affine[1][0], affine[1][1], affine[1][2]],
    [affine[2][0], affine[2][1], affine[2][2]],
  ];
  const T = [affine[0][3], affine[1][3], affine[2][3]];

  // 计算 spacing
  const spacing = [
    Math.hypot(R[0][0], R[1][0], R[2][0]),
    Math.hypot(R[0][1], R[1][1], R[2][1]),
    Math.hypot(R[0][2], R[1][2], R[2][2]),
  ];

  // 归一化方向
  const dirs = [
    [R[0][0] / spacing[0], R[1][0] / spacing[0], R[2][0] / spacing[0]],
    [R[0][1] / spacing[1], R[1][1] / spacing[1], R[2][1] / spacing[1]],
    [R[0][2] / spacing[2], R[1][2] / spacing[2], R[2][2] / spacing[2]],
  ];

  // 确定每个轴的主要方向
  const orientation = [];
  for (let i = 0; i < 3; i++) {
    const d = dirs[i];
    const abs = d.map(Math.abs);
    const maxIdx = abs.indexOf(Math.max(...abs));
    const sign = Math.sign(d[maxIdx]);
    const label =
        maxIdx === 0 ? (sign > 0 ? 'R' : 'L')
            : maxIdx === 1 ? (sign > 0 ? 'A' : 'P')
                : (sign > 0 ? 'S' : 'I');
    orientation.push(label);
  }

  console.log(orientation.join(''));

  // --- 动态生成正交 affine ---
  // 1. 计算每个方向对应哪一个世界轴
  // 2. 按该方向排列 spacing（自动翻转）
  const corrected = [
    [0, 0, 0, T[0]],
    [0, 0, 0, T[1]],
    [0, 0, 0, T[2]],
    [0, 0, 0, 1],
  ];

  for (let i = 0; i < 3; i++) {
    const label = orientation[i];
    const flip = (label === 'L' || label === 'P' || label === 'I') ? -1 : 1;

    if (label === 'R' || label === 'L') {
      corrected[0][i] = flip * spacing[i];
    } else if (label === 'A' || label === 'P') {
      corrected[1][i] = flip * spacing[i];
    } else if (label === 'S' || label === 'I') {
      corrected[2][i] = flip * spacing[i];
    }
  }

  return corrected;
}

/**
 * Extract direction matrix from NIfTI affine matrix in SimpleITK format (row-major, LPS)
 * SimpleITK uses row-major order: [row0_x, row0_y, row0_z, row1_x, row1_y, row1_z, row2_x, row2_y, row2_z]
 * Reference: https://simpleitk.readthedocs.io/en/master/fundamentalConcepts.html
 */
function getoriginDirection(affine) {
  // Extract spacing from affine matrix
  const spacing = [
    Math.sqrt(affine[0][0] ** 2 + affine[1][0] ** 2 + affine[2][0] ** 2),
    Math.sqrt(affine[0][1] ** 2 + affine[1][1] ** 2 + affine[2][1] ** 2),
    Math.sqrt(affine[0][2] ** 2 + affine[1][2] ** 2 + affine[2][2] ** 2),
  ];

  // Extract direction matrix (normalized rotation part) in RAS space (row-major)
  const directionRAS = [
    affine[0][0] / spacing[0],
    affine[0][1] / spacing[1],
    affine[0][2] / spacing[2],
    affine[1][0] / spacing[0],
    affine[1][1] / spacing[1],
    affine[1][2] / spacing[2],
    affine[2][0] / spacing[0],
    affine[2][1] / spacing[1],
    affine[2][2] / spacing[2],
  ];

  // Convert from RAS to LPS (keep row-major order)
  // RAS to LPS: negate first two rows (X and Y world coordinate rows)
  // In row-major format: [r0c0, r0c1, r0c2, r1c0, r1c1, r1c2, r2c0, r2c1, r2c2]
  const directionLPS = [
    -directionRAS[0], // row0_col0 (negate entire row 0)
    -directionRAS[1], // row0_col1 (negate entire row 0)
    -directionRAS[2], // row0_col2 (negate entire row 0)
    -directionRAS[3], // row1_col0 (negate entire row 1)
    -directionRAS[4], // row1_col1 (negate entire row 1)
    -directionRAS[5], // row1_col2 (negate entire row 1)
    directionRAS[6],  // row2_col0 (keep row 2)
    directionRAS[7],  // row2_col1 (keep row 2)
    directionRAS[8],  // row2_col2 (keep row 2)
  ];

  return directionLPS;
}

function rasToLps(niftiHeader) {
  let { affine } = niftiHeader;

  // Correct affine
  affine = correctAffine(affine);

  // RAS
  const { orientation, origin, spacing } = parseAffineMatrix(affine);

  // LPS
  const newOrigin = [-origin[0], -origin[1], origin[2]] as Types.Point3;

  // Change row-major to column-major for LPS orientation
  const newOrientation = [
    -orientation[0],
    -orientation[3],
    orientation[6],
    -orientation[1],
    -orientation[4],
    orientation[7],
    -orientation[2],
    -orientation[5],
    orientation[8],
  ];

  // Get SimpleITK-compatible direction from original affine (before correction)
  const originDirection = getoriginDirection(niftiHeader.affine);

  return {
    origin: newOrigin,
    orientation: newOrientation,
    spacing,
    originDirection,
  };
}

function lpsToRas(header) {
  const { origin, orientation, spacing, dimensions, dataType } = header;

  const newOrigin = [-origin[0], -origin[1], origin[2]];
  const newOrientation = [
    -orientation[0],
    -orientation[3],
    orientation[6],
    -orientation[1],
    -orientation[4],
    orientation[7],
    -orientation[2],
    -orientation[5],
    orientation[8],
  ];

  return {
    orientation: newOrientation,
    origin: [newOrigin[0], newOrigin[1], newOrigin[2]],
    dataType,
    dimensions,
    spacing,
    slope: header.slope,
    inter: header.inter,
    max: header.max,
    min: header.min,
  };
}

export { lpsToRas, rasToLps, invertDataPerFrame };
