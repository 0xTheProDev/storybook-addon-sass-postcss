import type { Configuration, RuleSetRule, RuleSetUseItem } from 'webpack';
import { logger } from '@storybook/node-logger';
import postcss from 'postcss';
import sass from 'sass';

type StyleLoaderOptions = Record<string, unknown>;
type CssLoaderOptions = Record<string, unknown> & {
  importLoaders?: number;
};
type SassLoaderOptions = Record<string, unknown> & {
  implementation?: typeof sass;
};

type PostcssLoaderOptions = Record<string, unknown> & {
  implementation?: typeof postcss;
};

interface Options {
  styleLoaderOptions?: StyleLoaderOptions | false;
  cssLoaderOptions?: CssLoaderOptions | false;
  sassLoaderOptions?: SassLoaderOptions | false;
  postcssLoaderOptions?: PostcssLoaderOptions | false;
  rule?: RuleSetRule;
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
    styleLoaderOptions,
    sassLoaderOptions,
    postcssLoaderOptions,
    rule = {},
  } = options;

  let { cssLoaderOptions } = options;

  if (typeof cssLoaderOptions === 'object') {
    cssLoaderOptions = {
      ...cssLoaderOptions,
      importLoaders: 1, // We always need to apply postcss-loader before css-loader
    };
  }

  let postcssFactory = postcss;
  if (typeof postcssLoaderOptions === 'object') {
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
            ...wrapLoader(require.resolve('style-loader'), styleLoaderOptions),
            ...wrapLoader(require.resolve('css-loader'), cssLoaderOptions),
            ...wrapLoader(require.resolve('sass-loader'), sassLoaderOptions),
            ...wrapLoader(
              require.resolve('postcss-loader'),
              postcssLoaderOptions,
            ),
          ],
        },
      ],
    },
  };
};
