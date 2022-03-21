import { useState, useRef, useCallback, useEffect } from 'react'
import fixWebmDuration from 'webm-duration-fix';
import './App.css';

const mimeType = 'video/webm\;codecs=vp9';
let dataChunks: Blob[] = [];

function App() {
  const previewRef = useRef<HTMLVideoElement>(null); // preview video
  const replayRef = useRef<HTMLVideoElement>(null); // replay video
  const [ hasVideo, saveHasVideState ] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const repairedBlobRef = useRef<Blob | null>(null); // repaired blob

  // Start - 开始录制
  const starRecorder = useCallback(() => {
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    }).then((stream) => {
      // set the stream to left video
      if(previewRef.current) {
        previewRef.current.srcObject = stream;
      }
      recording(stream);
    })
    .catch((err) => {
      console.log("recording error: ", err);
    });
  }, []);
  // MediaRecorder-recording
  const recording = useCallback((stream: MediaStream) => {
    recorder.current = new MediaRecorder(stream);

    recorder.current.ondataavailable = (event) => {
      let data = event.data;
      dataChunks.push(data);
    };
    recorder.current.start(1000);
    recorder.current.onstop = async () => {
      try {
        /* ------ fix blob, support fix webm file larger than 2GB ------ */
        repairedBlobRef.current = await fixWebmDuration(new Blob([...dataChunks], { type: mimeType })); 
        dataChunks = [];
        saveHasVideState(true);
      } catch (error) {
        
      }
    };
    // update btn status
    saveHasVideState(false);
  }, []);
  // Stop - 停止录制
  const stopRecorder = useCallback(() => {
    if (recorder.current) {
      recorder.current.stop();
    }
    if(previewRef.current) {
      previewRef.current.srcObject = null;
    }
  }, []);
  // Replay - 重放录制
  const replayRecorder = useCallback(() => {
    if(replayRef.current && repairedBlobRef.current) {
      let url = URL.createObjectURL(repairedBlobRef.current);
      replayRef.current.src = url;
    }
  }, []);
  // Download - 下载录制
  const downLoadRecorder = useCallback(() => {
    // 创建隐藏的可下载链接
    if (repairedBlobRef.current) {
      let url = URL.createObjectURL(repairedBlobRef.current);
      var eleLink = document.createElement('a');
      eleLink.download = 'fileName.webm';
      eleLink.href = url;
      document.body.appendChild(eleLink);
      eleLink.click();
      document.body.removeChild(eleLink);
    }
  }, []);

  return (
    <div className="App">
      <div className="left">
        <div className="rightBtn">
          <button className="button" onClick={starRecorder}>Start</button>
          <button className="button" onClick={stopRecorder}>Stop</button>
        </div>
        <h2>Preview</h2>
        <div className="video"><video ref={previewRef} width="100%" height="100%" autoPlay controls></video></div>
      </div>

      <div className="right">
        <div className="rightBtn">
          <button className={`button ${!hasVideo ? 'disable' : ''}`} onClick={downLoadRecorder}>Download</button>
          <button className={`button ${!hasVideo ? 'disable' : ''}`} onClick={replayRecorder}>Replay</button>
        </div>
        <h2>Record</h2>
        <div className="video">
          <video ref={replayRef} width="100%" height="100%" controls autoPlay></video>
        </div>
      </div>
    </div>
  )
}

export default App;

