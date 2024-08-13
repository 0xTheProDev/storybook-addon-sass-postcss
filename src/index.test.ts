import { logger } from "@storybook/node-logger";
import type { Configuration } from "webpack";
import postcss from "postcss";
import sass from "sass";

import { webpack } from "./index";

vi.mock("@storybook/node-logger");

describe("webpack hook", () => {
  const loaderMatcher = {
    use: expect.arrayContaining([
      expect.objectContaining({
        loader: expect.stringContaining("style-loader"),
      }),
      expect.objectContaining({
        loader: expect.stringContaining("css-loader"),
      }),
      expect.objectContaining({
        loader: expect.stringContaining("sass-loader"),
      }),
      expect.objectContaining({
        loader: expect.stringContaining("postcss-loader"),
      }),
    ]),
  };

  it("adds loaders to the end of a webpack config", () => {
    const configFixture = {
      module: {
        rules: ["dummy-loader"],
      },
    } as unknown as Configuration;
    const config = webpack(configFixture);
    expect(config.module?.rules?.[0]).toEqual("dummy-loader");
    expect(config.module?.rules?.[1]).toMatchObject(loaderMatcher);
  });

  it("applying to an empty webpack config", () => {
    const configFixture = {};
    const config = webpack(configFixture);
    expect(config.module?.rules?.[0]).toMatchObject(loaderMatcher);
  });

  it("accepts a custom postcss through postcssLoaderOptions & logs the version being used", () => {
    const version = "99.99.99";
    const configFixture = {};
    const fakePostcss = (() => ({ version })) as unknown as typeof postcss;
    const config = webpack(configFixture, {
      postcssLoaderOptions: {
        implementation: fakePostcss,
      },
    });
    expect(config.module?.rules?.[0]).toMatchObject({
      use: expect.arrayContaining([
        expect.objectContaining({
          loader: expect.stringContaining("postcss-loader"),
          options: {
            implementation: fakePostcss,
          },
        }),
      ]),
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(`postcss@${version}`),
    );
  });

  it("accepts a custom sass through sassLoaderOptions", () => {
    const version = "99.99.99";
    const configFixture = {};
    const fakeSass = (() => ({ version })) as unknown as typeof sass;
    const config = webpack(configFixture, {
      sassLoaderOptions: {
        implementation: fakeSass,
      },
    });
    expect(config.module?.rules?.[0]).toMatchObject({
      use: expect.arrayContaining([
        expect.objectContaining({
          loader: expect.stringContaining("sass-loader"),
          options: {
            implementation: fakeSass,
          },
        }),
      ]),
    });
  });

  it("always ensures importLoaders set to 1 on css-loader", () => {
    const configFixture = {};
    const config = webpack(configFixture, {
      cssLoaderOptions: {
        importLoaders: 2,
      },
    });
    expect(config.module?.rules?.[0]).toMatchObject({
      use: expect.arrayContaining([
        expect.objectContaining({
          loader: expect.stringContaining("css-loader"),
          options: expect.objectContaining({
            importLoaders: 1,
          }),
        }),
      ]),
    });
  });

  it("disables all loaders if their options are set to false", () => {
    const configFixture = {};
    const config = webpack(configFixture, {
      styleLoaderOptions: false,
      cssLoaderOptions: false,
      sassLoaderOptions: false,
      postcssLoaderOptions: false,
    });
    expect(config.module?.rules?.[0]).toMatchObject({
      use: [],
    });
  });

  it("overrides rule properties with option", () => {
    const configFixture = {};
    const config = webpack(configFixture, {
      rule: {
        sideEffects: false,
      },
    });
    expect(config.module?.rules?.[0]).toMatchObject({
      sideEffects: false,
    });
  });

  it("allows Sass loader to be placed at the end", () => {
    const configFixture = {};
    const config = webpack(configFixture, {
      loadSassAfterPostCSS: true,
    });
    expect(
      (config.module?.rules?.[0] as unknown as { use: unknown[] }).use[3],
    ).toMatchObject({
      loader: expect.stringContaining("sass-loader"),
    });
  });
});
