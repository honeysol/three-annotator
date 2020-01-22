import { getGeometryState } from "./geometryState";

const getRay = ({ raymouse, camera }) => {
  if (camera && camera.isPerspectiveCamera) {
    return new THREE.Vector3()
      .set(raymouse.x, raymouse.y, 0)
      .unproject(camera)
      .sub(camera.position)
      .normalize();
  } else {
    console.error("Unsupported camera type.");
  }
};
const raycaster = new THREE.Raycaster();
const getIntersect = ({ raymouse, camera, scene }) => {
  raycaster.setFromCamera(raymouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  const intersect = intersects.find(
    intersect => intersect.object.type === "Mesh"
  );
  return intersect;
};

export const annotateBySphere = ({
  x,
  y,
  camera,
  scene,
  container,
  radius,
  ignoreBackFace,
  color,
}) => {
  const raymouse = new THREE.Vector2(
    (x / container.clientWidth) * 2 - 1,
    -(y / container.clientHeight) * 2 + 1
  );
  const intersect = getIntersect({ raymouse, camera, scene });
  if (!intersect) {
    return;
  }
  const mesh = intersect.object;
  const geometry = mesh.geometry;
  // 高速化のため、逆行列をかけておく
  const center = intersect.point
    .clone()
    .applyMatrix4(new THREE.Matrix4().getInverse(mesh.matrix));
  const scale = mesh.scale.x; // scale.x, scale.y, scale.z are the same
  const limit = (radius * radius) / (scale * scale);
  const direction = getRay({ raymouse, camera });

  const geometryState = getGeometryState(geometry);
  return geometryState.annotate({
    center,
    direction,
    limit,
    color,
    ignoreBackFace,
  });
};

export const getCurrentParams = ({ scene }) => {
  let area = 0;
  const areas = {};
  scene.traverse(mesh => {
    if (mesh.type !== "Mesh") {
      return;
    }
    const geometry = mesh.geometry;
    if (!geometry.isBufferGeometry) {
      return;
    }
    const geometryState = getGeometryState(geometry);
    const result = geometryState.getCurrentParams();
    area += result.area;
    result.areas.forEach(o => {
      areas[o.colorId] = (areas[o.colorId] || 0) + o.area;
    });
  });
  return {
    area,
    areas,
  };
};

export const setColorOptions = (options, { scene }) => {
  scene.traverse(mesh => {
    if (mesh.type !== "Mesh") {
      return;
    }
    const geometry = mesh.geometry;
    if (!geometry.isBufferGeometry) {
      return;
    }
    const geometryState = getGeometryState(geometry);
    geometryState.setColorOptions(options);
  });
};
