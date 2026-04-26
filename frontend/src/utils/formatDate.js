// 날짜를 "n분 전", "n시간 전", "n일 전" 같은 상대적 표현으로 포맷
// 매물 등록 시간을 절대값(2024-01-01)보다 상대값으로 보여줘 최신성 파악이 쉽도록 함
export const formatRelativeDate = (dateString) => {
  if (!dateString) return '';

  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString('ko-KR');
};
