import React, { MouseEvent } from 'react';

import dayjs from 'dayjs';
import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import { Information } from 'icons';
import { FormattedMessage, InjectedIntlProps } from 'react-intl';
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { METRICS } from 'redux/auditResults/constants';
import { AuditResultsAsGraphData, MetricType } from 'redux/auditResults/types';
import { colorUsage, fontFamily, fontSize, getSpacing } from 'stylesheet';
import Style from './MetricGraph.style';

export interface OwnProps {
  auditResults: AuditResultsAsGraphData;
  metrics: MetricType[];
}

type Props = OwnProps & InjectedIntlProps;

const MetricGraph: React.FunctionComponent<Props> = props => {
  const { auditResults, intl, metrics } = props;
  const [isMetricInfoTooltipVisible, setIsMetricInfoTooltipVisible] = React.useState(false);
  const [metricInfoTooltipLeft, setMetricInfoTooltipLeft] = React.useState('auto');
  const [metricInfoTooltipTop, setMetricInfoTooltipTop] = React.useState('auto');

  const legendRef = React.useRef<HTMLDivElement>(null);
  const metricInfoIconContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(
    () => {
      if (legendRef.current && metricInfoIconContainerRef.current) {
        setMetricInfoTooltipLeft(
          Math.floor(
            metricInfoIconContainerRef.current.getBoundingClientRect().right -
              legendRef.current.getBoundingClientRect().left +
              30,
          ) + 'px',
        );
        setMetricInfoTooltipTop(
          Math.floor(
            metricInfoIconContainerRef.current.getBoundingClientRect().top -
              legendRef.current.getBoundingClientRect().top -
              5,
          ) + 'px',
        );
      }
    },
    [legendRef.current, metricInfoIconContainerRef.current],
  );

  const renderLegend = (legendProps: { payload: Array<{ value: MetricType }> }) => {
    const { payload } = legendProps;
    return payload.map((entry, index) => (
      <Style.Legend margin={`0 0 ${getSpacing(2)} ${getSpacing(4)}`} key={index} ref={legendRef}>
        <Style.LegendTitle>
          {intl.formatMessage({ id: `Metrics.${entry.value}.name` })}
        </Style.LegendTitle>
        <Style.MetricInfoIconContainer
          margin={`0 0 0 ${getSpacing(2)}`}
          onClick={toggleMetricInfoTooltipVisibility}
          ref={metricInfoIconContainerRef}
        >
          <Information color={colorUsage.metricInformationIcon} />
        </Style.MetricInfoIconContainer>
        {isMetricInfoTooltipVisible && (
          <Style.MetricInfoTooltip left={metricInfoTooltipLeft} top={metricInfoTooltipTop}>
            <FormattedMessage id={`Metrics.${entry.value}.description`} />
          </Style.MetricInfoTooltip>
        )}
      </Style.Legend>
    ));
  };

  const getFormattedValue = (dataType: 'number' | 'percent' | 'time', value: number) => {
    switch (dataType) {
      case 'time':
        return `${(value / 1000).toFixed(2)}s`;
      case 'percent':
        return `${Math.floor(value * 100)}%`;
      case 'number':
        return `${value}`;
    }
  };

  dayjs.extend(LocalizedFormat).locale(intl.locale);

  const renderTooltip = (tooltipProps: {
    label: number;
    payload: Array<{ value: number; dataKey: MetricType }>;
  }) => {
    const { payload, label } = tooltipProps;
    return payload.map((entry, index) => {
      const dataType = METRICS[entry.dataKey].type;
      const formattedDate = intl.formatMessage(
        {
          id: 'components.MetricGraph.tooltipDate',
        },
        {
          day: dayjs(label)
            .format('L')
            .replace(new RegExp('[^.]?' + dayjs().format('YYYY') + '.?'), ''), // remove year
          time: dayjs(label).format('LT'),
        },
      );
      return (
        <Style.Tooltip key={index}>
          <Style.TooltipValue>{getFormattedValue(dataType, entry.value)}</Style.TooltipValue>
          <Style.TooltipDate>{formattedDate}</Style.TooltipDate>
        </Style.Tooltip>
      );
    });
  };

  const toggleMetricInfoTooltipVisibility = (event: MouseEvent) => {
    event.preventDefault();
    if (isMetricInfoTooltipVisible) {
      hideMetricInfoTooltip();
    } else {
      showMetricInfoTooltip();
    }
  };

  const showMetricInfoTooltip = () => {
    setIsMetricInfoTooltipVisible(true);
    document.addEventListener('click', hideMetricInfoTooltip);
  };

  const hideMetricInfoTooltip = () => {
    setIsMetricInfoTooltipVisible(false);
    document.removeEventListener('click', hideMetricInfoTooltip);
  };

  return (
    <ResponsiveContainer width={'100%'} height={'100%'}>
      <AreaChart data={auditResults || undefined}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colorUsage.graphLine} stopOpacity={0.8} />
            <stop offset="95%" stopColor={colorUsage.graphLine} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Legend verticalAlign="top" align="left" iconSize={0} content={renderLegend} />
        <YAxis
          type="number"
          tick={{
            color: `${colorUsage.smallText}`,
            fontFamily: `${fontFamily.mainSans}`,
            fontSize: `${fontSize.smallText}`,
          }}
          axisLine={false}
          tickLine={false}
          interval={'preserveStart'}
        />
        <XAxis
          width={30}
          dataKey="date"
          tickFormatter={tickItem => dayjs(tickItem).format('DD/MM')}
          tick={{
            color: `${colorUsage.smallText}`,
            fontFamily: `${fontFamily.mainSans}`,
            fontSize: `${fontSize.smallText}`,
          }}
          axisLine={false}
          tickLine={false}
          minTickGap={50}
          interval={'preserveStart'}
        />
        <Tooltip content={renderTooltip} cursor={{ stroke: colorUsage.graphTooltipCursor }} />
        {metrics.map(metric => (
          <Area
            key={metric}
            type="monotone"
            dataKey={metric}
            stroke={colorUsage.graphLine}
            fillOpacity={1}
            fill="url(#areaGradient)"
            activeDot={{
              fill: colorUsage.graphTooltipActiveDot,
              stroke: colorUsage.graphTooltipActiveDotBorder,
              strokeWidth: 4,
              r: 10,
            }}
            dot={false}
            strokeWidth={5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default MetricGraph;
