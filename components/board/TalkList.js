import React from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import TalkItem from './TalkItem';
import EmptyState from './EmptyState';
import LoadingFooter from './LoadingFooter';

export default function TalkList({
  data,
  loading,
  refreshing,
  loadingMore,
  hasMore,
  showMyTalk,
  onRefresh,
  onLoadMore,
  onMessage,
  onMore,
  onProfilePress
}) {
  return (
    <FlatList
      data={data}
      renderItem={({ item }) => (
        <TalkItem
          talk={item}
          onMessage={onMessage}
          onMore={onMore}
          onProfilePress={onProfilePress}
        />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#FF6B6B']}
        />
      }
      onEndReached={hasMore && !loadingMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.1}
      ListEmptyComponent={loading ? null : <EmptyState showMyTalk={showMyTalk} />}
      ListFooterComponent={<LoadingFooter loadingMore={loadingMore} />}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 12,
    flexGrow: 1,
  },
}); 