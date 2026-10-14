import { describe, expect, it } from 'vitest';
import { createLogFeed, type LogFeedEvent } from './logFeed';

describe('logFeed', () => {
  it('meldet roundFinished an angemeldete Zuhörer', () => {
    const feed = createLogFeed();
    const events: LogFeedEvent[] = [];
    feed.subscribe((e) => events.push(e));

    feed.roundFinished();
    expect(events).toEqual(['round-finished']);
  });

  it('meldet changedOutside an angemeldete Zuhörer', () => {
    const feed = createLogFeed();
    const events: LogFeedEvent[] = [];
    feed.subscribe((e) => events.push(e));

    feed.changedOutside();
    expect(events).toEqual(['changed-outside']);
  });

  it('meldet nach dem Abmelden nichts mehr', () => {
    const feed = createLogFeed();
    const events: LogFeedEvent[] = [];
    const unsubscribe = feed.subscribe((e) => events.push(e));

    feed.roundFinished();
    expect(events).toHaveLength(1);

    unsubscribe();
    feed.roundFinished();
    feed.changedOutside();
    expect(events).toHaveLength(1);
  });

  it('bedient mehrere Zuhörer unabhängig voneinander', () => {
    const feed = createLogFeed();
    const first: LogFeedEvent[] = [];
    const second: LogFeedEvent[] = [];

    const unsubFirst = feed.subscribe((e) => first.push(e));
    feed.subscribe((e) => second.push(e));

    feed.roundFinished();
    expect(first).toEqual(['round-finished']);
    expect(second).toEqual(['round-finished']);

    unsubFirst();
    feed.changedOutside();
    expect(first).toEqual(['round-finished']);
    expect(second).toEqual(['round-finished', 'changed-outside']);
  });
});
