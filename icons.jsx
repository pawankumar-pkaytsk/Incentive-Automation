/* =====================================================================
   Incentive Automation — inline SVG icon set (no font dependency)
   <Icon name="target" size={18} style={{ color: '...' }} />
   24×24 viewBox, currentColor stroke. Robust in any sandbox.
   ===================================================================== */
(function () {
  const P = React.createElement;
  const path = (d, extra) => P('path', Object.assign({ d, key: d.slice(0, 8) }, extra));
  const dot = (cx, cy) => P('circle', { cx, cy, r: 1.1, fill: 'currentColor', stroke: 'none', key: 'd' + cx + cy });

  const ICONS = {
    'target':        [P('circle', { cx: 12, cy: 12, r: 9, key: 'a' }), P('circle', { cx: 12, cy: 12, r: 5, key: 'b' }), P('circle', { cx: 12, cy: 12, r: 1.4, fill: 'currentColor', stroke: 'none', key: 'c' })],
    'chart-line-up': [path('M3 17l6-6 4 4 8-8'), path('M15 7h6v6')],
    'medal':         [P('circle', { cx: 12, cy: 9, r: 6, key: 'a' }), path('M8.5 13.7L7 22l5-3 5 3-1.5-8.3')],
    'first-aid-kit': [path('M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'), path('M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'), path('M12 12v5'), path('M9.5 14.5h5')],
    'arrow-u-up-left':[path('M3 8v6h6'), path('M3.5 13a9 9 0 1 1 2.6 6.4')],
    'megaphone':     [path('M3 11l15-5v13L3 15z'), path('M3 11H2v4h1'), path('M8 16.5a2.5 2.5 0 0 0 4.8.9')],
    'sparkle':       [path('M12 3l2.2 6.3L20 12l-5.8 2.7L12 21l-2.2-6.3L4 12l5.8-2.7z')],
    'crown-simple':  [path('M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z')],
    'check-circle':  [P('circle', { cx: 12, cy: 12, r: 9, key: 'a' }), path('M8.5 12l2.5 2.5L16 9')],
    'check':         [path('M5 12.5l4.5 4.5L19 7')],
    'warning':       [path('M10.3 4.3L2.4 17.6A1.8 1.8 0 0 0 4 20.3h16a1.8 1.8 0 0 0 1.6-2.7L13.7 4.3a1.9 1.9 0 0 0-3.4 0z'), path('M12 10v4'), dot(12, 17)],
    'warning-octagon':[path('M8 2.5h8L21.5 8v8L16 21.5H8L2.5 16V8z'), path('M12 8v4.5'), dot(12, 16.5)],
    'warning-circle':[P('circle', { cx: 12, cy: 12, r: 9, key: 'a' }), path('M12 7.5v5'), dot(12, 16)],
    'shield-check':  [path('M12 21.5s7.5-3.8 7.5-9.5V5.2L12 2.5 4.5 5.2v6.8c0 5.7 7.5 9.5 7.5 9.5z'), path('M9 12l2 2 4-4')],
    'users':         [path('M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20'), P('circle', { cx: 9.5, cy: 7, r: 3.6, key: 'a' }), path('M21 20v-1.5a4 4 0 0 0-3-3.8'), path('M15.5 3.6a3.6 3.6 0 0 1 0 6.8')],
    'users-three':   [P('circle', { cx: 12, cy: 8, r: 3.2, key: 'a' }), path('M6.5 9.2a2.6 2.6 0 1 1 .2-5'), path('M17.3 4.2a2.6 2.6 0 1 1 .2 5'), path('M7 20v-1a5 5 0 0 1 10 0v1'), path('M2.5 19v-.6a3.4 3.4 0 0 1 3-3.4'), path('M21.5 19v-.6a3.4 3.4 0 0 0-3-3.4')],
    'user':          [P('circle', { cx: 12, cy: 8, r: 3.8, key: 'a' }), path('M5 20v-1a6 6 0 0 1 14 0v1')],
    'envelope-simple':[path('M3 6h18v12H3z'), path('M3.5 7l8.5 6 8.5-6')],
    'arrow-right':   [path('M4 12h15'), path('M13 6l6 6-6 6')],
    'arrow-left':    [path('M20 12H5'), path('M11 6l-6 6 6 6')],
    'caret-right':   [path('M9 5l7 7-7 7')],
    'caret-up-down': [path('M8 9l4-4 4 4'), path('M16 15l-4 4-4-4')],
    'calendar-dots': [path('M4 5h16v16H4z'), path('M4 9.5h16'), path('M8 3v4'), path('M16 3v4'), dot(9, 14), dot(15, 14)],
    'sign-out':      [path('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4'), path('M16 16.5l4.5-4.5L16 7.5'), path('M20 12H9')],
    'plus-circle':   [P('circle', { cx: 12, cy: 12, r: 9, key: 'a' }), path('M12 8v8'), path('M8 12h8')],
    'note-pencil':   [path('M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6'), path('M18 2.5a2 2 0 0 1 3 3L12 14.5l-4 1 1-4z')],
    'floppy-disk':   [path('M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'), path('M17 21v-8H7v8'), path('M8 3.5V8h7')],
    'storefront':    [path('M3.5 9.5L5 4h14l1.5 5.5'), path('M4 9.5v10.5h16V9.5'), path('M3.2 9.5a2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.6 0 2.8 2.8 0 0 0 5.6 0'), path('M9.5 20v-5.5h5V20')],
    'heartbeat':     [path('M22 12h-4.5l-2.5 6.5L9 5.5 6.5 12H2')],
    'seal-check':    [path('M9.5 3.2a3.5 3.5 0 0 1 5 0l.6.6a3.5 3.5 0 0 0 2.6 1l.9.1a3.5 3.5 0 0 1 3 3l.1.9a3.5 3.5 0 0 0 1 2.6l.6.6a3.5 3.5 0 0 1 0 5l-.6.6a3.5 3.5 0 0 0-1 2.6l-.1.9'), path('M8.5 12l2.5 2.5L16 9'), path('M3.2 14.5a3.5 3.5 0 0 1 0-5l.6-.6a3.5 3.5 0 0 0 1-2.6l.1-.9a3.5 3.5 0 0 1 3-3', { display: 'none' })],
    'gauge':         [path('M4.5 16.5a8 8 0 1 1 15 0'), path('M12 13l3.5-3.5'), P('circle', { cx: 12, cy: 13, r: 1.3, fill: 'currentColor', stroke: 'none', key: 'c' })],
    'wallet':        [path('M3 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'), path('M3 8.5l13-4.2V6'), P('circle', { cx: 16.5, cy: 12.5, r: 1.3, fill: 'currentColor', stroke: 'none', key: 'c' })],
    'squares-four':  [path('M4 4h7v7H4z'), path('M13 4h7v7h-7z'), path('M4 13h7v7H4z'), path('M13 13h7v7h-7z')],
    'download-simple':[path('M12 3.5v11.5'), path('M7.5 11l4.5 4.5 4.5-4.5'), path('M5 20.5h14')],
    'magnifying-glass':[P('circle', { cx: 11, cy: 11, r: 7, key: 'a' }), path('M20.5 20.5L16 16')],
    'shield':        [path('M12 21.5s7.5-3.8 7.5-9.5V5.2L12 2.5 4.5 5.2v6.8c0 5.7 7.5 9.5 7.5 9.5z')],
    'flag':          [path('M5 21V4'), path('M5 4.5h11l-2 3.5 2 3.5H5')],
    'list-checks':   [path('M10 6h11'), path('M10 12h11'), path('M10 18h11'), path('M3 6l1.5 1.5L7 4.5'), path('M3 12l1.5 1.5L7 10.5'), path('M3 18l1.5 1.5L7 16.5')],
    'trend-up':      [path('M3 17l6-6 4 4 8-8'), path('M15 7h6v6')],
    'trend-down':    [path('M3 7l6 6 4-4 8 8'), path('M15 17h6v-6')],
    'minus':         [path('M5 12h14')],
    'info':          [P('circle', { cx: 12, cy: 12, r: 9, key: 'a' }), path('M12 11v5'), dot(12, 8)],
    'clock':         [P('circle', { cx: 12, cy: 12, r: 9, key: 'a' }), path('M12 7.5V12l3 2')],
    'hand-coins':    [P('circle', { cx: 16.5, cy: 7, r: 3.2, key: 'a' }), path('M3 13l4-1.5a3 3 0 0 1 2 .1l3 1.4a2 2 0 0 1-1.6 3.6L8 16'), path('M9 17l5 1.5a3 3 0 0 0 2-.1l5-2.4'), path('M3 12v8')],
    'chart-bar':     [path('M4 20V10'), path('M10 20V4'), path('M16 20v-7'), path('M21 20H3')],
    'percent':       [path('M19 5L5 19'), P('circle', { cx: 7.5, cy: 7.5, r: 2.5, key: 'a' }), P('circle', { cx: 16.5, cy: 16.5, r: 2.5, key: 'b' })],
    'x-circle':      [P('circle', { cx: 12, cy: 12, r: 9, key: 'a' }), path('M9 9l6 6'), path('M15 9l-6 6')],
    'caret-down':    [path('M6 9l6 6 6-6')],
    'lock':          [path('M6 11h12v9H6z'), path('M8.5 11V8a3.5 3.5 0 0 1 7 0v3')],
  };

  // simplify seal-check (remove the hidden helper path that won't render)
  ICONS['seal-check'] = [
    P('circle', { cx: 12, cy: 12, r: 9, key: 'a' }),
    path('M8.5 12l2.5 2.5L16 9'),
  ];

  const Icon = ({ name, size = 16, strokeWidth = 1.9, style = {}, className }) => {
    const kids = ICONS[name] || ICONS['warning-circle'];
    return React.createElement('svg', {
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
      className,
      style: Object.assign({ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }, style),
    }, kids);
  };

  window.Icon = Icon;
})();
