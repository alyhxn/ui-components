const components = require("..");

const factories = Object.keys(components).map((name) => [
  name,
  components[name],
]);
document.createElement("div").className = "root";
document.body.append(
  ...factories.map(([name, fn]) => {
    const container = document.createElement("div");
    container.append(fn());
    return container;
  })
);
