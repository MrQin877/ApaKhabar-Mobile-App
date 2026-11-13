<?php

use App\Models\ShortVideo;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;

function mobileShort(string $status = 'published', int $days = 0): ShortVideo
{
    return ShortVideo::create([
        'created_by' => User::factory()->create()->getKey(), 'title' => 'Mobile Short',
        'description' => 'Description', 'video_url' => 'https://example.com/video.mp4', 'thumbnail_url' => 'https://example.com/video.jpg',
        'video_public_id' => 'mobile', 'status' => $status, 'metadata' => ['duration' => 20],
        'published_at' => now()->subDays($days), 'view_count' => 0,
    ]);
}

test('mobile Shorts are newest first, exclude archives and never count impressions', function () {
    $older = mobileShort('published', 2);
    $older->update(['view_count' => 100]);
    $latest = mobileShort();
    mobileShort('archived');
    mobileShort('draft');
    $deleted = mobileShort(); $deleted->delete();
    $this->getJson('/api/shorts?mobile=1')->assertOk()->assertJsonPath('mobile_feed', true)
        ->assertJsonPath('shorts.data.0.id', $latest->id)->assertJsonCount(2, 'shorts.data')
        ->assertJsonStructure(['shorts' => ['data' => [['published_at', 'liked_by_user', 'video_url']]]]);
    expect($latest->fresh()->view_count)->toBe(0);
});

test('mobile bearer likes persist and detail reflects the current viewer', function () {
    $video = mobileShort();
    $user = User::factory()->create();
    $headers = ['Authorization' => 'Bearer '.$user->createToken('mobile-short')->plainTextToken];
    $this->postJson('/api/shorts/'.$video->id.'/like', [], $headers)->assertOk()->assertJsonPath('liked', true)->assertJsonPath('likes_count', 1);
    $this->getJson('/api/shorts/'.$video->id, $headers)->assertOk()->assertJsonPath('data.liked_by_user', true);
    $this->postJson('/api/shorts/'.$video->id.'/like', [], $headers)->assertOk()->assertJsonPath('liked', false)->assertJsonPath('likes_count', 0);
});

test('mobile guest views require an aged identity-bound token and deduplicate', function () {
    $video = mobileShort();
    $identity = $this->postJson('/api/guest-comments/identity')->assertSuccessful()->json('token');
    $headers = ['X-Guest-Token' => $identity];
    $token = $this->getJson('/api/shorts/'.$video->id.'/view-token', $headers)->assertOk()->json('token');
    $this->postJson('/api/shorts/'.$video->id.'/view', ['token' => $token], $headers)->assertStatus(422);
    $claim = json_decode(Crypt::decryptString($token), true); $claim['time'] -= 6;
    $aged = Crypt::encryptString(json_encode($claim));
    $this->postJson('/api/shorts/'.$video->id.'/view', ['token' => $aged], $headers)->assertOk()->assertJsonPath('view_count', 1);
    $this->postJson('/api/shorts/'.$video->id.'/view', ['token' => $aged], $headers)->assertOk()->assertJsonPath('view_count', 1);
    $this->postJson('/api/shorts/'.$video->id.'/like')->assertUnauthorized();
});
