import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { areaElementClasses, lineElementClasses } from '@mui/x-charts/LineChart';

function getLast30Days() {
  const days = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
    days.push(`${monthName} ${date.getDate()}`);
  }
  return days;
}

function AreaGradient({ color, id }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.25} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

AreaGradient.propTypes = {
  color: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};

function StatCard({ title, value, interval, trend, data, chartLabels }) {
  const theme = useTheme();

  const trendLabels = {
    up: 'Crescendo',
    down: 'Reduzindo',
    neutral: 'Estável',
  };

  // 👇 Todas as cores padrão do texto/tema
  const baseColor = theme.palette.text.primary;

  const chartData = React.useMemo(() => {
    if (Array.isArray(data)) {
      return data.map((val) => Number(val) || 0);
    }
    return [];
  }, [data]);

  const displayLabels = chartLabels || getLast30Days();
  const hasChartData = chartData.length > 0 && chartData.some((v) => v > 0);

  // 👇 Corrige cor dos <rect> dos labels
  React.useEffect(() => {
    const styleId = 'statcard-global-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    const styleEl = document.getElementById(styleId);
    styleEl.textContent = `
      .MuiChartsLabelMark-fill rect,
      .MuiChartsLabelMark-mask rect,
      .MuiChartsLabelMark-fill,
      .MuiChartsLabelMark-mask {
        fill: ${baseColor} !important;
      }
      .MuiChartsTooltip-root svg rect {
        fill: ${baseColor} !important;
      }
    `;
  }, [baseColor]);

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        flexGrow: 1,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        transition: 'none',
      }}
    >
      <Typography
        component="h2"
        variant="subtitle2"
        gutterBottom
        sx={{
          color: 'text.primary',
          fontWeight: 'medium',
          fontSize: '0.875rem',
        }}
      >
        {title}
      </Typography>

      <Stack direction="column" sx={{ justifyContent: 'space-between', flexGrow: 1, gap: 1 }}>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack
            direction="row"
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="h4"
              component="p"
              sx={{
                color: 'text.primary',
                fontWeight: 'bold',
                fontSize: { xs: '1.5rem', sm: '2rem' },
                lineHeight: 1.2,
              }}
            >
              {value}
            </Typography>

            {trend && (
              <Chip
                size="small"
                label={trendLabels[trend]}
                sx={{
                  fontWeight: 'medium',
                  fontSize: '0.7rem',
                  transition: 'none',
                  height: 24,
                }}
              />
            )}
          </Stack>

          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              mt: 0.5,
              fontSize: '0.75rem',
            }}
          >
            {interval}
          </Typography>
        </Stack>

        <Box sx={{ width: '100%', height: 60, mt: 1 }}>
          {hasChartData && (
            <SparkLineChart
              data={chartData}
              area
              showHighlight
              showTooltip
              xAxis={{
                scaleType: 'band',
                data: displayLabels,
              }}
              sx={{
                width: '100%',
                height: '100%',
                [`& .${lineElementClasses.root}`]: {
                  stroke: baseColor,
                  strokeWidth: 2,
                },
                [`& .${areaElementClasses.root}`]: {
                  fill: `url(#area-gradient-${title})`,
                },
                '& .MuiHighlightElement-root': {
                  fill: baseColor,
                },
              }}
            >
              <AreaGradient color={baseColor} id={`area-gradient-${title}`} />
            </SparkLineChart>
          )}
        </Box>
      </Stack>
    </Card>
  );
}

StatCard.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number),
  chartLabels: PropTypes.arrayOf(PropTypes.string),
  interval: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  trend: PropTypes.oneOf(['down', 'neutral', 'up']),
};

StatCard.defaultProps = {
  data: [],
  chartLabels: null,
  trend: null,
};

export default StatCard;
