<?php

namespace App\Http\Controllers\Home;

use App\Http\Controllers\Controller;
use App\Models\ShortVideo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

// Mobile routes use bearer/opaque guest credentials, never website session cookies.
class MobileShortController extends Controller
{
    public function index(Request $request)
    {
        if (! $request->boolean('mobile')) {
            return app(VideoPageController::class)->index($request);
        }
        $videos = ShortVideo::where('status', 'published')->whereNotNull('published_at')
            ->withPublicEngagement()->latest('published_at')->latest('id')->paginate(12);
        $videos->through(fn ($video) => $this->present($video, $request));
        return response()->json(['mobile_feed' => true, 'shorts' => $videos]);
    }

    public function show(Request $request, int $id)
    {
        $video = ShortVideo::where('status', 'published')->whereNotNull('published_at')->withPublicEngagement()->findOrFail($id);
        return response()->json(['data' => $this->present($video, $request)]);
    }

    private function present(ShortVideo $video, Request $request): array
    {
        return array_merge($video->only(['id', 'title', 'description', 'thumbnail_url', 'video_url', 'published_at', 'view_count', 'likes_count', 'comments_count']), [
            'liked_by_user' => $request->user() ? DB::table('short_video_likes')->where('short_video_id', $video->id)->where('user_id', $request->user()->getKey())->exists() : false,
        ]);
    }

    private function viewer(Request $request): string
    {
        if ($request->user()) return 'user:'.$request->user()->getKey();
        $identity = $request->attributes->get('mobile_guest_identity');
        abort_unless($identity, 401);
        return 'mobile-guest:'.$identity->id;
    }

    public function token(Request $request, int $id)
    {
        ShortVideo::where('status', 'published')->whereNotNull('published_at')->findOrFail($id);
        return response()->json(['token' => Crypt::encryptString(json_encode([
            'short' => $id, 'viewer' => $this->viewer($request), 'time' => now()->timestamp,
        ]))])->header('Cache-Control', 'no-store');
    }

    public function view(Request $request, int $id)
    {
        $data = $request->validate(['token' => 'required|string|max:2000']);
        $viewer = $this->viewer($request);
        try {
            $claim = json_decode(Crypt::decryptString($data['token']), true, 512, JSON_THROW_ON_ERROR);
            $age = now()->timestamp - $claim['time'];
            $valid = (int) $claim['short'] === $id && $age >= 5 && $age <= 7200 && hash_equals($viewer, $claim['viewer']);
        } catch (\Throwable) { $valid = false; }
        abort_unless($valid, 422);
        $count = DB::transaction(function () use ($id, $viewer) {
            $video = ShortVideo::where('status', 'published')->whereNotNull('published_at')->lockForUpdate()->findOrFail($id);
            $inserted = DB::table('short_video_viewers')->insertOrIgnore(['short_video_id' => $id, 'viewer_key' => $viewer, 'viewed_at' => now()]);
            if ($inserted) $video->increment('view_count');
            return (int) $video->view_count;
        });
        return response()->json(['view_count' => $count]);
    }
}
