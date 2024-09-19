import type { Configuration, RuleSetRule, RuleSetUseItem } from "webpack";
import { logger } from "@storybook/core/node-logger";
import postcss from "postcss";
import sass from "sass";

type PostCSS = typeof postcss;
type Sass = typeof sass;

type StyleLoaderOptions = Record<string, unknown>;
type CssLoaderOptions = Record<string, unknown> & {
  importLoaders?: number;
  modules?: Record<string, string>;
};

type SassLoaderOptions = Record<string, unknown> & {
  implementation?: Sass;
};

type PostcssLoaderOptions = Record<string, unknown> & {
  implementation?: PostCSS;
};

interface Options {
  cssLoaderOptions?: CssLoaderOptions | false;
  loadSassAfterPostCSS?: boolean;
  postcssLoaderOptions?: PostcssLoaderOptions | false;
  rule?: RuleSetRule;
  sassLoaderOptions?: SassLoaderOptions | false;
  styleLoaderOptions?: StyleLoaderOptions | false;
}

function wrapLoader(
  loader: string,
  options?:
    | StyleLoaderOptions
    | CssLoaderOptions
    | SassLoaderOptions
    | PostcssLoaderOptions
    | false,
): RuleSetUseItem[] {
  if (options === false) {
    return [];
  }

  return [{ loader, options }];
}

export const webpack = (
  webpackConfig: Configuration = {},
  options: Options = {},
): Configuration => {
  const {
    loadSassAfterPostCSS = false,
    postcssLoaderOptions,
    sassLoaderOptions,
    styleLoaderOptions,
    rule = {},
  } = options;

  let { cssLoaderOptions } = options;

  if (typeof cssLoaderOptions === "object") {
    cssLoaderOptions = {
      ...cssLoaderOptions,
      importLoaders: 1, // We always need to apply postcss-loader before css-loader
    };
  }

  let postcssFactory = postcss;
  if (typeof postcssLoaderOptions === "object") {
    postcssFactory = postcssLoaderOptions?.implementation ?? postcss;
  }

  const { version } = postcssFactory();

  logger.info(`=> Using PostCSS preset with postcss@${version}`);

  let regexPattern = /\.css$/;

  if (sassLoaderOptions !== false) {
    regexPattern = /\.(css|scss|sass)$/i;
  }

  return {
    ...webpackConfig,
    module: {
      ...webpackConfig.module,
      rules: [
        ...(webpackConfig.module?.rules ?? []),
        {
          test: regexPattern,
          sideEffects: true,
          ...rule,
          use: [
            ...wrapLoader(
              require.resolve("style-loader").toString(),
              styleLoaderOptions,
            ),
            ...wrapLoader(
              require.resolve("css-loader").toString(),
              cssLoaderOptions,
            ),
            ...(!loadSassAfterPostCSS
              ? wrapLoader(
                  require.resolve("sass-loader").toString(),
                  sassLoaderOptions,
                )
              : []),
            ...wrapLoader(
              require.resolve("postcss-loader").toString(),
              postcssLoaderOptions,
            ),
            ...(loadSassAfterPostCSS
              ? wrapLoader(
                  require.resolve("sass-loader").toString(),
                  sassLoaderOptions,
                )
              : []),
          ],
        },
      ],
    },
  };
};
